// app/Chatpanel/AdminChatRequests/[backendApiKey]/page.js
'use client';
import { use } from 'react';
import AdminChatRequests from '../../../components/AdminChatRequests';

export default function AdminChatRequestsPage({ params }) {
  // Unwrap the params promise using React.use()
  const unwrappedParams = use(params);
  
  return (
    <AdminChatRequests 
      backendApiKey={unwrappedParams.backendApiKey}
    />
  );
}