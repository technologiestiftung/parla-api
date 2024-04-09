create extension pg_jsonschema;

create table user_requests(
    id serial primary key,
    created_at timestamp not null,

    request_payload json not null,
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

    question text not null,
    generated_answer text, -- can be null
    llm_model text not null,
    llm_embedding_model text not null,

    matching_documents json not null,
    check (
        json_matches_schema(
            '{
	"type": "array",
	"items": {
		"type": "object",
		"properties": {
			"registered_document_id": { "type": "number" },
			"processed_document_id": { "type": "number" },
            "similarity": { "type": "number" },
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