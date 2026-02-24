import { SessionProvider } from "next-auth/react";
import '../app/globals.css'; // Ensure CSS is loaded

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;