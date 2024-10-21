export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Database = {
	graphql_public: {
		Tables: {
			[_ in never]: never;
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			graphql: {
				Args: {
					operationName?: string;
					query?: string;
					variables?: Json;
					extensions?: Json;
				};
				Returns: Json;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
	public: {
		Tables: {
			external_sources: {
				Row: {
					added_at: string;
					id: number;
					source_url: string;
					title: string;
				};
				Insert: {
					added_at: string;
					id?: number;
					source_url: string;
					title: string;
				};
				Update: {
					added_at?: string;
					id?: number;
					source_url?: string;
					title?: string;
				};
				Relationships: [];
			};
			feedbacks: {
				Row: {
					id: number;
					kind: Database["public"]["Enums"]["feedback_type"];
					tag: string | null;
				};
				Insert: {
					id?: number;
					kind: Database["public"]["Enums"]["feedback_type"];
					tag?: string | null;
				};
				Update: {
					id?: number;
					kind?: Database["public"]["Enums"]["feedback_type"];
					tag?: string | null;
				};
				Relationships: [];
			};
			processed_document_chunks: {
				Row: {
					chunk_index: number;
					content: string;
					embedding: string;
					embedding_temp: string | null;
					id: number;
					page: number;
					processed_document_id: number | null;
				};
				Insert: {
					chunk_index: number;
					content: string;
					embedding: string;
					embedding_temp?: string | null;
					id?: number;
					page: number;
					processed_document_id?: number | null;
				};
				Update: {
					chunk_index?: number;
					content?: string;
					embedding?: string;
					embedding_temp?: string | null;
					id?: number;
					page?: number;
					processed_document_id?: number | null;
				};
				Relationships: [
					{
						foreignKeyName: "processed_document_chunks_processed_document_id_fkey";
						columns: ["processed_document_id"];
						isOneToOne: false;
						referencedRelation: "processed_documents";
						referencedColumns: ["id"];
					},
				];
			};
			processed_document_summaries: {
				Row: {
					id: number;
					processed_document_id: number | null;
					summary: string;
					summary_embedding: string;
					summary_embedding_temp: string | null;
					tags: string[];
				};
				Insert: {
					id?: number;
					processed_document_id?: number | null;
					summary: string;
					summary_embedding: string;
					summary_embedding_temp?: string | null;
					tags: string[];
				};
				Update: {
					id?: number;
					processed_document_id?: number | null;
					summary?: string;
					summary_embedding?: string;
					summary_embedding_temp?: string | null;
					tags?: string[];
				};
				Relationships: [
					{
						foreignKeyName: "processed_document_summaries_processed_document_id_fkey";
						columns: ["processed_document_id"];
						isOneToOne: false;
						referencedRelation: "processed_documents";
						referencedColumns: ["id"];
					},
				];
			};
			processed_documents: {
				Row: {
					file_checksum: string;
					file_size: number;
					id: number;
					num_pages: number;
					processing_error: string | null;
					processing_finished_at: string | null;
					processing_started_at: string | null;
					registered_document_id: number | null;
				};
				Insert: {
					file_checksum: string;
					file_size: number;
					id?: number;
					num_pages: number;
					processing_error?: string | null;
					processing_finished_at?: string | null;
					processing_started_at?: string | null;
					registered_document_id?: number | null;
				};
				Update: {
					file_checksum?: string;
					file_size?: number;
					id?: number;
					num_pages?: number;
					processing_error?: string | null;
					processing_finished_at?: string | null;
					processing_started_at?: string | null;
					registered_document_id?: number | null;
				};
				Relationships: [
					{
						foreignKeyName: "processed_documents_registered_document_id_fkey";
						columns: ["registered_document_id"];
						isOneToOne: false;
						referencedRelation: "registered_documents";
						referencedColumns: ["id"];
					},
				];
			};
			registered_documents: {
				Row: {
					id: number;
					metadata: Json | null;
					registered_at: string;
					source_type: string;
					source_url: string;
				};
				Insert: {
					id?: number;
					metadata?: Json | null;
					registered_at: string;
					source_type: string;
					source_url: string;
				};
				Update: {
					id?: number;
					metadata?: Json | null;
					registered_at?: string;
					source_type?: string;
					source_url?: string;
				};
				Relationships: [];
			};
			user_request_feedbacks: {
				Row: {
					created_at: string | null;
					feedback_id: number;
					id: number;
					session_id: string;
					user_request_id: number;
				};
				Insert: {
					created_at?: string | null;
					feedback_id: number;
					id?: number;
					session_id: string;
					user_request_id: number;
				};
				Update: {
					created_at?: string | null;
					feedback_id?: number;
					id?: number;
					session_id?: string;
					user_request_id?: number;
				};
				Relationships: [
					{
						foreignKeyName: "user_request_feedbacks_feedback_id_fkey";
						columns: ["feedback_id"];
						isOneToOne: false;
						referencedRelation: "feedbacks";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "user_request_feedbacks_user_request_id_fkey";
						columns: ["user_request_id"];
						isOneToOne: false;
						referencedRelation: "user_requests";
						referencedColumns: ["id"];
					},
				];
			};
			user_requests: {
				Row: {
					chat_completion_time_ms: number | null;
					created_at: string;
					database_search_time_ms: number | null;
					embedding_time_ms: number | null;
					error: string | null;
					generated_answer: string | null;
					id: number;
					llm_embedding_model: string;
					llm_model: string;
					matching_documents: Json;
					moderation_time_ms: number | null;
					question: string;
					request_payload: Json;
					short_id: string | null;
				};
				Insert: {
					chat_completion_time_ms?: number | null;
					created_at: string;
					database_search_time_ms?: number | null;
					embedding_time_ms?: number | null;
					error?: string | null;
					generated_answer?: string | null;
					id?: number;
					llm_embedding_model: string;
					llm_model: string;
					matching_documents: Json;
					moderation_time_ms?: number | null;
					question: string;
					request_payload: Json;
					short_id?: string | null;
				};
				Update: {
					chat_completion_time_ms?: number | null;
					created_at?: string;
					database_search_time_ms?: number | null;
					embedding_time_ms?: number | null;
					error?: string | null;
					generated_answer?: string | null;
					id?: number;
					llm_embedding_model?: string;
					llm_model?: string;
					matching_documents?: Json;
					moderation_time_ms?: number | null;
					question?: string;
					request_payload?: Json;
					short_id?: string | null;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			find_registered_documents_with_errors: {
				Args: Record<PropertyKey, never>;
				Returns: {
					id: number;
					source_url: string;
					source_type: string;
					registered_at: string;
					metadata: Json;
				}[];
			};
			find_unprocessed_registered_documents: {
				Args: Record<PropertyKey, never>;
				Returns: {
					id: number;
					source_url: string;
					source_type: string;
					registered_at: string;
					metadata: Json;
				}[];
			};
			hash_encode: {
				Args: {
					"": number;
				};
				Returns: string;
			};
			id_decode: {
				Args: {
					"": string;
				};
				Returns: number[];
			};
			id_decode_once: {
				Args: {
					"": string;
				};
				Returns: number;
			};
			id_encode:
				| {
						Args: {
							"": number[];
						};
						Returns: string;
				  }
				| {
						Args: {
							"": number;
						};
						Returns: string;
				  };
			json_matches_schema: {
				Args: {
					schema: Json;
					instance: Json;
				};
				Returns: boolean;
			};
			jsonb_matches_schema: {
				Args: {
					schema: Json;
					instance: Json;
				};
				Returns: boolean;
			};
			jsonschema_is_valid: {
				Args: {
					schema: Json;
				};
				Returns: boolean;
			};
			jsonschema_validation_errors: {
				Args: {
					schema: Json;
					instance: Json;
				};
				Returns: string[];
			};
			match_document_chunks: {
				Args: {
					embedding: string;
					match_threshold: number;
					match_count: number;
					num_probes: number;
				};
				Returns: {
					id: number;
					processed_document_id: number;
					content: string;
					similarity: number;
				}[];
			};
			match_document_chunks_for_specific_documents: {
				Args: {
					processed_document_ids: number[];
					embedding: string;
					match_threshold: number;
					match_count: number;
					num_probes: number;
				};
				Returns: {
					id: number;
					processed_document_id: number;
					content: string;
					similarity: number;
				}[];
			};
			match_summaries: {
				Args: {
					embedding: string;
					match_threshold: number;
					match_count: number;
					num_probes: number;
				};
				Returns: {
					id: number;
					processed_document_id: number;
					summary: string;
					similarity: number;
				}[];
			};
			match_summaries_and_chunks: {
				Args: {
					embedding: string;
					match_threshold: number;
					chunk_limit: number;
					summary_limit: number;
					num_probes_chunks: number;
					num_probes_summaries: number;
				};
				Returns: {
					processed_document_id: number;
					chunk_ids: number[];
					chunk_similarities: number[];
					avg_chunk_similarity: number;
					summary_ids: number[];
					summary_similarity: number;
					similarity: number;
				}[];
			};
			regenerate_embedding_indices_for_chunks: {
				Args: Record<PropertyKey, never>;
				Returns: undefined;
			};
			regenerate_embedding_indices_for_summaries: {
				Args: Record<PropertyKey, never>;
				Returns: undefined;
			};
		};
		Enums: {
			feedback_type: "positive" | "negative";
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
	storage: {
		Tables: {
			buckets: {
				Row: {
					allowed_mime_types: string[] | null;
					avif_autodetection: boolean | null;
					created_at: string | null;
					file_size_limit: number | null;
					id: string;
					name: string;
					owner: string | null;
					owner_id: string | null;
					public: boolean | null;
					updated_at: string | null;
				};
				Insert: {
					allowed_mime_types?: string[] | null;
					avif_autodetection?: boolean | null;
					created_at?: string | null;
					file_size_limit?: number | null;
					id: string;
					name: string;
					owner?: string | null;
					owner_id?: string | null;
					public?: boolean | null;
					updated_at?: string | null;
				};
				Update: {
					allowed_mime_types?: string[] | null;
					avif_autodetection?: boolean | null;
					created_at?: string | null;
					file_size_limit?: number | null;
					id?: string;
					name?: string;
					owner?: string | null;
					owner_id?: string | null;
					public?: boolean | null;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			migrations: {
				Row: {
					executed_at: string | null;
					hash: string;
					id: number;
					name: string;
				};
				Insert: {
					executed_at?: string | null;
					hash: string;
					id: number;
					name: string;
				};
				Update: {
					executed_at?: string | null;
					hash?: string;
					id?: number;
					name?: string;
				};
				Relationships: [];
			};
			objects: {
				Row: {
					bucket_id: string | null;
					created_at: string | null;
					id: string;
					last_accessed_at: string | null;
					metadata: Json | null;
					name: string | null;
					owner: string | null;
					owner_id: string | null;
					path_tokens: string[] | null;
					updated_at: string | null;
					version: string | null;
				};
				Insert: {
					bucket_id?: string | null;
					created_at?: string | null;
					id?: string;
					last_accessed_at?: string | null;
					metadata?: Json | null;
					name?: string | null;
					owner?: string | null;
					owner_id?: string | null;
					path_tokens?: string[] | null;
					updated_at?: string | null;
					version?: string | null;
				};
				Update: {
					bucket_id?: string | null;
					created_at?: string | null;
					id?: string;
					last_accessed_at?: string | null;
					metadata?: Json | null;
					name?: string | null;
					owner?: string | null;
					owner_id?: string | null;
					path_tokens?: string[] | null;
					updated_at?: string | null;
					version?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "objects_bucketId_fkey";
						columns: ["bucket_id"];
						isOneToOne: false;
						referencedRelation: "buckets";
						referencedColumns: ["id"];
					},
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			can_insert_object: {
				Args: {
					bucketid: string;
					name: string;
					owner: string;
					metadata: Json;
				};
				Returns: undefined;
			};
			extension: {
				Args: {
					name: string;
				};
				Returns: string;
			};
			filename: {
				Args: {
					name: string;
				};
				Returns: string;
			};
			foldername: {
				Args: {
					name: string;
				};
				Returns: string[];
			};
			get_size_by_bucket: {
				Args: Record<PropertyKey, never>;
				Returns: {
					size: number;
					bucket_id: string;
				}[];
			};
			search: {
				Args: {
					prefix: string;
					bucketname: string;
					limits?: number;
					levels?: number;
					offsets?: number;
					search?: string;
					sortcolumn?: string;
					sortorder?: string;
				};
				Returns: {
					name: string;
					id: string;
					updated_at: string;
					created_at: string;
					last_accessed_at: string;
					metadata: Json;
				}[];
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
	PublicTableNameOrOptions extends
		| keyof (PublicSchema["Tables"] & PublicSchema["Views"])
		| { schema: keyof Database },
	TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
		? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
				Database[PublicTableNameOrOptions["schema"]]["Views"])
		: never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
	? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
			Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
				PublicSchema["Views"])
		? (PublicSchema["Tables"] &
				PublicSchema["Views"])[PublicTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	PublicTableNameOrOptions extends
		| keyof PublicSchema["Tables"]
		| { schema: keyof Database },
	TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
		? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
	? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
		? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	PublicTableNameOrOptions extends
		| keyof PublicSchema["Tables"]
		| { schema: keyof Database },
	TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
		? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
	? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
		? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	PublicEnumNameOrOptions extends
		| keyof PublicSchema["Enums"]
		| { schema: keyof Database },
	EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
		? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
		: never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
	? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
		? PublicSchema["Enums"][PublicEnumNameOrOptions]
		: never;
