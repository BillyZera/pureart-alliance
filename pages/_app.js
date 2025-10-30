
// pages/_app.js — wraps every page in the sitewide AppLayout so the new design shows up everywhere.
import "../styles/globals.css";
import "../styles/paa-theme.css";
import AppLayout from "../components/AppLayout";

export default function MyApp({ Component, pageProps }) {
  // If a page defines its own getLayout, we respect it. Otherwise wrap with AppLayout.
  const getLayout = Component.getLayout || ((page) => <AppLayout>{page}</AppLayout>);
  return getLayout(<Component {...pageProps} />);
}
