
// pages/_app.js — minimal file to load the site theme globally
import "../styles/globals.css";
import "../styles/paa-theme.css";

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
