import {useEffect} from 'react';
import {useHistory} from '@docusaurus/router';

// Minimal root landing: immediately route to the docs installation page.
// Keeps '/' a real, linkable route (navbar/footer/404 reference it) while
// dropping the marketing homepage. (AI-assisted)
export default function RootRedirect() {
  const history = useHistory();
  useEffect(() => {
    history.push('/docs/next/installation');
  }, [history]);
  return (
    <main
      style={{
        display: 'flex',
        minHeight: '60vh',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <p>Redirecting to docs…</p>
    </main>
  );
}
