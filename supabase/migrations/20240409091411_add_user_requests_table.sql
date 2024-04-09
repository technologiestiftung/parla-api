create extension pg_jsonschema;

create table user_requests(
    id serial primary key,
    created_at timestamp,

    request_payload json,
    check(json_matches_schema('{
	"type": "object",
	"properties": {
		"query": {
			"type": "string"
		},
		"match_threshold": {
			"type": "number"
		},
		"num_probes_chunks": {
			"type": "number"
		},
		"num_probes_summaries": {
			"type": "number"
		},
		"search_algorithm": {
			"type": "string"
		},
		"chunk_limit": {
			"type": "number"
		},
		"summary_limit": {
			"type": "number"
		},
		"document_limit": {
			"type": "number"
		}
	}
}'::json, request_payload)),

    question text,
    generated_answer text,
    llm_model text,

    matching_documents json,
    check (
        json_matches_schema(
            '{
	"type": "array",
	"items": {
		"type": "object",
		"properties": {
			"registered_document_id": { "type": "number" },
			"processed_document_id": { "type": "number" },
			"processed_document_summary_match": {
				"type": "object",
				"properties": {
					"processed_document_summary_id": { "type": "number" },
					"processed_document_summary_similarity": { "type": "number" }
				}
			},
			"processed_document_chunk_matches": {
				"type": "array",
				"items": {
					"type": "object",
					"properties": {
						"processed_document_chunk_id": { "type": "number" },
						"processed_document_chunk_similarity": { "type": "number" }
					}
				}
			}
		}
	}
}'::json,
            matching_documents
        )
    )
);