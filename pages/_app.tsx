import type { AppProps } from 'next/app';
import { useSmoothScroll } from '@/lib/useSmoothScroll';
import CustomCursor from '@/components/shared/CustomCursor';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  useSmoothScroll();

  return (
    <>
      <CustomCursor />
      <div className="noise-overlay" />
      <div className="vignette" />
      <Component {...pageProps} />
    </>
  );
}
