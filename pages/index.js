import React from 'react';
import Head from 'next/head';
import App from '../components/App';

export default function Home() {
  return (
    <>
      <Head>
        <title>NextJS Audio Player</title>
        <meta name="description" content="NextJS Audio Player with Authentication" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <App />
    </>
  );
}
