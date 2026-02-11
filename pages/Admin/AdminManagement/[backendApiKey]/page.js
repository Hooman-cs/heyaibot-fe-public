// app/SuperAdmin/SuperAdminManagement/[backendApiKey]/page.js
'use client';
import { use } from 'react';
import SuperAdmin from '../../../components/Admin';

export default function SuperAdminPage({ params }) {
  const unwrappedParams = use(params);
  
  return (
    <SuperAdmin backendApiKey={unwrappedParams.backendApiKey} />
  );
}