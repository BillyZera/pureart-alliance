
// pages/_app.js — ensure layout wraps every page
import "../styles/globals.css";
import "../styles/paa-theme.css";
import AppLayout from "../components/AppLayout";

export default function MyApp({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => <AppLayout>{page}</AppLayout>);
  return getLayout(<Component {...pageProps} />);
}
