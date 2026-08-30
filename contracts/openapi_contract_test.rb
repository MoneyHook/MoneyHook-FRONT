# frozen_string_literal: true

require "minitest/autorun"
require "yaml"

class OpenApiContractTest < Minitest::Test
  SPEC_PATH = File.expand_path("openapi.yaml", __dir__)
  HTTP_METHODS = %w[get post put patch delete options head trace].freeze
  V1_OPERATIONS = {
    "/api/v1/transactions" => %w[post],
    "/api/v1/transactions/{transactionId}" => %w[get patch delete],
    "/api/v1/analytics/overview" => %w[get],
    "/api/v1/analytics/categories" => %w[get],
    "/api/v1/analytics/fixed" => %w[get],
    "/api/v1/analytics/payments" => %w[get],
    "/api/v1/budget" => %w[get put],
    "/api/v1/settings" => %w[get patch]
  }.freeze

  def setup
    @spec = YAML.safe_load_file(SPEC_PATH, aliases: true)
  end

  def test_local_references_resolve
    references = collect_references(@spec)
    unresolved = references.reject { |reference| resolve_reference(reference) }

    assert_empty unresolved
  end

  def test_operation_ids_are_present_and_unique
    operations = all_operations
    operation_ids = operations.map { |operation| operation.fetch("operationId") }

    assert_equal operations.length, operation_ids.uniq.length
  end

  def test_v1_operation_set_is_complete
    actual = @spec.fetch("paths").each_with_object({}) do |(path, path_item), result|
      next unless path.start_with?("/api/v1/")

      result[path] = path_item.keys & HTTP_METHODS
    end

    assert_equal V1_OPERATIONS, actual
    assert_equal 12, actual.values.sum(&:length)
  end

  def test_v1_operations_require_bearer_auth_and_declare_common_errors
    all_operations.select { |operation| operation.fetch("path").start_with?("/api/v1/") }.each do |operation|
      assert_equal [{"BearerAuth" => []}], operation.fetch("security"), operation.fetch("operationId")

      responses = operation.fetch("responses")
      assert responses.key?("401"), "#{operation.fetch('operationId')} must declare 401"
      assert responses.key?("500"), "#{operation.fetch('operationId')} must declare 500"
    end
  end

  def test_all_business_operations_require_firebase_bearer_auth
    all_operations.each do |operation|
      next if operation.fetch("path") == "/"

      assert_equal [{"BearerAuth" => []}], operation.fetch("security"), operation.fetch("operationId")
      responses = operation.fetch("responses")
      %w[401 409 500].each do |status|
        assert responses.key?(status), "#{operation.fetch('operationId')} must declare #{status}"
      end
    end
  end

  def test_legacy_authentication_contract_is_removed
    refute @spec.fetch("paths").key?("/api/user/googleSignIn")
    refute @spec.fetch("components").fetch("securitySchemes").key?("AuthorizationValue")
    refute @spec.fetch("components").fetch("schemas").key?("GoogleSignInRequest")
  end

  def test_transaction_resource_is_closed_and_complete
    schema = @spec.dig("components", "schemas", "V1TransactionResource")
    expected_fields = %w[
      transaction_id transaction_date transaction_time transaction_name amount sign signed_amount
      category_id category_name sub_category_id sub_category_name fixed_flg payment_id payment_name
    ]

    assert_equal false, schema.fetch("additionalProperties")
    assert_equal expected_fields.sort, schema.fetch("required").sort
    assert_equal expected_fields.sort, schema.fetch("properties").keys.sort
  end

  def test_out_of_scope_features_are_not_added_to_v1_contract
    v1_document = {
      "paths" => @spec.fetch("paths").select { |path, _| path.start_with?("/api/v1/") },
      "schemas" => @spec.fetch("components").fetch("schemas").select { |name, _| name.start_with?("V1") }
    }.to_s.downcase

    %w[notification memo pagination page_size frequent_category].each do |feature|
      refute_includes v1_document, feature
    end
  end

  private

  def all_operations
    @spec.fetch("paths").flat_map do |path, path_item|
      path_item.filter_map do |method, operation|
        next unless HTTP_METHODS.include?(method)

        operation.merge("path" => path, "method" => method)
      end
    end
  end

  def collect_references(value, references = [])
    case value
    when Hash
      value.each do |key, child|
        references << child if key == "$ref" && child.start_with?("#/")
        collect_references(child, references)
      end
    when Array
      value.each { |child| collect_references(child, references) }
    end
    references
  end

  def resolve_reference(reference)
    reference.delete_prefix("#/").split("/").reduce(@spec) do |value, token|
      break unless value.is_a?(Hash)

      value[token.gsub("~1", "/").gsub("~0", "~")]
    end
  end
end
