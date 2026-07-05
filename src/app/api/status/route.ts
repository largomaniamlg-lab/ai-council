import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/data";
import {
  SIMULATOR_MODEL,
  SIMULATOR_PROVIDER,
  SIMULATOR_PLAN,
  getSimulatorModelDisplayName,
} from "@/lib/simulatorEngine";

// Solo devuelve si cada proveedor esta configurado (booleano), nunca las
// claves en si. Pensado para la pantalla de Settings.
export async function GET() {
  const openrouterConfigured = Boolean(process.env.OPENROUTER_API_KEY);

  return NextResponse.json({
    providers: {
      openai: Boolean(process.env.OPENAI_API_KEY),
      openrouter: openrouterConfigured,
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
      google: Boolean(process.env.GOOGLE_API_KEY),
      xai: Boolean(process.env.XAI_API_KEY),
    },
    supabase: isSupabaseConfigured(),
    simulatorModel: SIMULATOR_MODEL,
    simulator: {
      provider: SIMULATOR_PROVIDER,
      modelDisplayName: getSimulatorModelDisplayName(),
      plan: SIMULATOR_PLAN,
      connected: openrouterConfigured,
    },
  });
}
