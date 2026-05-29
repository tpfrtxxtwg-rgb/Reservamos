import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Buildings,
  Timer,
  MagnifyingGlass,
  CreditCard,
  Tag,
  CheckCircle,
  XCircle,
  Clock,
  ShieldWarning,
} from '@phosphor-icons/react';
import { trpc } from '@/providers/trpc';
import { useClientAuth } from '@/providers/ClientAuthProvider';

export default function AdminCompanies() {
  const { t } = useTranslation();
  const { isSuperAdmin } = useClientAuth();
  const [search, setSearch] = useState('');

  const { data: companies, isLoading } = trpc.companies.list.useQuery();

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Access Denied</p>
      </div>
    );
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Companies</h2>
      <p>Total: {(companies || []).length}</p>
    </div>
  );
}
