'use client';
import { useRouter } from 'next/navigation';

export default function SuperAdminRoot() {
  const router = useRouter();

  return (
    <div style={{ 
      padding: '2rem', 
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>APP ID Required</h1>
      <p>Please provide an APP ID in the URL:</p>
      <code style={{ 
        background: '#f5f5f5', 
        padding: '1rem', 
        display: 'block', 
        margin: '1rem 0',
        borderRadius: '4px'
      }}>
        /SuperAdmin/APP ID
      </code>
      <p>Example:</p>
      <code style={{ 
        background: '#e8f5e8', 
        padding: '0.5rem', 
        display: 'inline-block',
        borderRadius: '4px'
      }}>
        https://www.heyaibot.com/SuperAdmin/ef8b0285-31cb-43333333e14
      </code>
    </div>
  );
}