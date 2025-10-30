
// pages/_app.js — session provider + global layout (modern look)
import { useState } from "react";
import "../styles/globals.css";
import "../styles/paa-theme.css";
import AppLayout from "../components/AppLayout";
import { SessionContextProvider, createBrowserSupabaseClient } from "@supabase/auth-helpers-react";

export default function MyApp({ Component, pageProps }) {
  const [supabase] = useState(() => createBrowserSupabaseClient());
  const getLayout = Component.getLayout || ((page) => <AppLayout>{page}</AppLayout>);

  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={pageProps.initialSession}>
      {getLayout(<Component {...pageProps} />)}
    </SessionContextProvider>
  );
}
