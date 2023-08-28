import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.js";
import { EnvError } from "./errors.js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (SUPABASE_URL === undefined) throw new EnvError("SUPABASE_URL is undefined");
if (SUPABASE_SERVICE_ROLE_KEY === undefined)
	throw new EnvError("SUPABASE_SERVICE_ROLE_KEY is undefined");

const supabase = createClient<Database>(
	SUPABASE_URL,
	SUPABASE_SERVICE_ROLE_KEY,
	{
		auth: { persistSession: false },
	},
);
export default supabase;
