import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  SquaresFour,
  CalendarCheck,
  Car,
  Users,
  Calendar,
  ChartBar,
  Gear,
  ArrowLeft,
  Eye,
  CheckCircle,
  Clock as ClockIcon,
  XCircle,
  TrendUp,
  TrendDown,
  X,
  MapPin,
  CreditCard,
} from '@phosphor-icons/react';
import { mockReservations } from '@/data/mock';
import type { Reservation } from '@/types';

interface AdminPanelProps {
  onBack: () => void;
}

const sidebarItems = [
  { icon: <SquaresFour size={20} />, label: 'Dashboard', id: 'dashboard' },
  { icon: <CalendarCheck size={20} />, label: 'Reservas', id: 'reservations' },
  { icon: <Car size={20} />, label: 'Veh\u00edculos', id: 'vehicles' },
  { icon: <Users size={20} />, label: 'Conductores', id: 'drivers' },
  { icon: <Calendar size={20} />, label: 'Calendario', id: 'calendar' },
  { icon: <ChartBar size={20} />, label: 'Reportes', id: 'reports' },
  { icon: <Gear size={20} />, label: 'Configuraci\u00f3n', id: 'settings' },
];

const statusConfig = {
  confirmed: { label: 'Confirmada', icon: <CheckCircle size={14} weight="fill" />, bg: 'bg-[rgba(45,106,79,0.1)]', text: 'text-[#2D6A4F]' },
  pending: { label: 'Pendiente', icon: <ClockIcon size={14} weight="fill" />, bg: 'bg-[rgba(199,140,58,0.1)]', text: 'text-[#C78C3A]' },
  cancelled: { label: 'Cancelada', icon: <XCircle size={14} weight="fill" />, bg: 'bg-[rgba(178,58,47,0.1)]', text: 'text-[#B23A2F]' },
};

export default function AdminPanel({ onBack }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const totalReservations = mockReservations.length;
  const confirmedCount = mockReservations.filter(r => r.status === 'confirmed').length;
  const pendingCount = mockReservations.filter(r => r.status === 'pending').length;
  const totalRevenue = mockReservations
    .filter(r => r.status === 'confirmed')
    .reduce((sum, r) => sum + r.price, 0);

  const stats = [
    { label: 'Total Reservas', value: totalReservations, trend: '+12%', up: true },
    { label: 'Ingresos (Mes)', value: `$${totalRevenue.toLocaleString()}`, trend: '+8%', up: true },
    { label: 'Pendientes', value: pendingCount, trend: '-3', up: true },
    { label: 'Confirmadas', value: confirmedCount, trend: '+15%', up: true },
  ];

  return (
    <div className="min-h-screen bg-sand-light flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 bottom-0 w-[240px] bg-charcoal z-50 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-5 flex items-center justify-between">
          <span className="font-display text-xl font-bold text-white">ReserVamos</span>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-body text-sm transition-all mb-1 ${
                activeTab === item.id
                  ? 'bg-[rgba(199,94,58,0.15)] text-terracotta border-l-[3px] border-terracotta'
                  : 'text-white/70 hover:bg-white/5'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/60 hover:text-white font-body text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            Volver al sitio
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-[rgba(138,130,120,0.1)] flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-charcoal">
              <SquaresFour size={24} />
            </button>
            <h1 className="font-display text-xl font-semibold text-charcoal capitalize">
              {sidebarItems.find(i => i.id === activeTab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-terracotta flex items-center justify-center text-white font-body text-sm font-semibold">
              RM
            </div>
          </div>
        </header>

        <div className="p-6 md:p-8">
          {activeTab === 'dashboard' && (
            <div>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map(stat => (
                  <div key={stat.label} className="bg-white rounded-lg shadow-sm p-5">
                    <span className="font-body text-xs text-warm-gray uppercase tracking-wide">{stat.label}</span>
                    <div className="flex items-end justify-between mt-2">
                      <span className="font-body text-2xl font-bold text-charcoal">{stat.value}</span>
                      <span className={`flex items-center gap-0.5 font-body text-xs ${stat.up ? 'text-[#2D6A4F]' : 'text-[#B23A2F]'}`}>
                        {stat.up ? <TrendUp size={12} /> : <TrendDown size={12} />}
                        {stat.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Reservations Table */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[rgba(138,130,120,0.1)] flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold text-charcoal">Reservas Recientes</h2>
                  <button
                    onClick={() => setActiveTab('reservations')}
                    className="font-body text-sm text-terracotta hover:underline"
                  >
                    Ver todas
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[rgba(138,130,120,0.1)]">
                        <th className="text-left px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-wide">C\u00f3digo</th>
                        <th className="text-left px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-wide">Cliente</th>
                        <th className="text-left px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-wide hidden md:table-cell">Servicio</th>
                        <th className="text-left px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-wide hidden lg:table-cell">Fecha</th>
                        <th className="text-left px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-wide">Estado</th>
                        <th className="text-left px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-wide"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockReservations.slice(0, 5).map(reservation => {
                        const status = statusConfig[reservation.status];
                        return (
                          <tr key={reservation.id} className="border-b border-[rgba(138,130,120,0.05)] hover:bg-sand-light/50 transition-colors">
                            <td className="px-6 py-4 font-body text-sm font-medium text-charcoal">{reservation.code}</td>
                            <td className="px-6 py-4">
                              <div className="font-body text-sm text-charcoal">{reservation.clientName}</div>
                              <div className="font-body text-xs text-warm-gray">{reservation.clientEmail}</div>
                            </td>
                            <td className="px-6 py-4 font-body text-sm text-charcoal hidden md:table-cell">{reservation.service}</td>
                            <td className="px-6 py-4 font-body text-sm text-warm-gray hidden lg:table-cell">{reservation.date}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-body text-xs font-medium ${status.bg} ${status.text}`}>
                                {status.icon}
                                {status.label}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => setSelectedReservation(reservation)}
                                className="text-warm-gray hover:text-terracotta transition-colors"
                              >
                                <Eye size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reservations' && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(138,130,120,0.1)]">
                      <th className="text-left px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-wide">C\u00f3digo</th>
                      <th className="text-left px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-wide">Cliente</th>
                      <th className="text-left px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-wide">Servicio</th>
                      <th className="text-left px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-wide">Fecha</th>
                      <th className="text-left px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-wide hidden md:table-cell">Veh\u00edculo</th>
                      <th className="text-left px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-wide">Estado</th>
                      <th className="text-left px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-wide">Precio</th>
                      <th className="text-left px-6 py-3 font-body text-xs font-medium text-warm-gray uppercase tracking-wide"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockReservations.map(reservation => {
                      const status = statusConfig[reservation.status];
                      return (
                        <tr key={reservation.id} className="border-b border-[rgba(138,130,120,0.05)] hover:bg-sand-light/50 transition-colors">
                          <td className="px-6 py-4 font-body text-sm font-medium text-charcoal">{reservation.code}</td>
                          <td className="px-6 py-4">
                            <div className="font-body text-sm text-charcoal">{reservation.clientName}</div>
                            <div className="font-body text-xs text-warm-gray">{reservation.clientEmail}</div>
                          </td>
                          <td className="px-6 py-4 font-body text-sm text-charcoal">{reservation.service}</td>
                          <td className="px-6 py-4 font-body text-sm text-warm-gray">{reservation.date}<br/><span className="text-xs">{reservation.time}</span></td>
                          <td className="px-6 py-4 font-body text-sm text-charcoal hidden md:table-cell">{reservation.vehicle}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-body text-xs font-medium ${status.bg} ${status.text}`}>
                              {status.icon}
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-body text-sm font-semibold text-terracotta">${reservation.price}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedReservation(reservation)}
                              className="text-warm-gray hover:text-terracotta transition-colors"
                            >
                              <Eye size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab !== 'dashboard' && activeTab !== 'reservations' && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-sand flex items-center justify-center mx-auto mb-4">
                  <Gear size={24} className="text-warm-gray" />
                </div>
                <h3 className="font-display text-lg font-semibold text-charcoal mb-1">
                  En desarrollo
                </h3>
                <p className="font-body text-sm text-warm-gray">
                  Esta secci\u00f3n estar\u00e1 disponible pronto.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Reservation Detail Modal */}
      {selectedReservation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-[rgba(138,130,120,0.1)]">
              <h3 className="font-display text-lg font-semibold text-charcoal">
                Detalle de Reserva
              </h3>
              <button
                onClick={() => setSelectedReservation(null)}
                className="text-warm-gray hover:text-charcoal transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-body text-sm text-warm-gray">C\u00f3digo</span>
                <span className="font-body text-sm font-semibold text-charcoal">{selectedReservation.code}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body text-sm text-warm-gray">Cliente</span>
                <span className="font-body text-sm font-medium text-charcoal">{selectedReservation.clientName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body text-sm text-warm-gray">Email</span>
                <span className="font-body text-sm text-charcoal">{selectedReservation.clientEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-warm-gray">
                <MapPin size={14} />
                <span className="font-body text-sm">{selectedReservation.origin} \u2192 {selectedReservation.destination}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body text-sm text-warm-gray">Fecha y Hora</span>
                <span className="font-body text-sm text-charcoal">{selectedReservation.date} \u00b7 {selectedReservation.time}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body text-sm text-warm-gray">Pasajeros</span>
                <span className="font-body text-sm text-charcoal">{selectedReservation.passengers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body text-sm text-warm-gray">Veh\u00edculo</span>
                <span className="font-body text-sm text-charcoal">{selectedReservation.vehicle}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body text-sm text-warm-gray">Estado</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-body text-xs font-medium ${statusConfig[selectedReservation.status].bg} ${statusConfig[selectedReservation.status].text}`}>
                  {statusConfig[selectedReservation.status].icon}
                  {statusConfig[selectedReservation.status].label}
                </span>
              </div>
              <div className="border-t border-[rgba(138,130,120,0.1)] pt-3 flex justify-between items-center">
                <span className="font-body text-sm font-semibold text-charcoal">Total</span>
                <span className="font-body text-xl font-bold text-terracotta flex items-center gap-1">
                  <CreditCard size={16} />
                  ${selectedReservation.price} USD
                </span>
              </div>
            </div>
            <div className="p-5 border-t border-[rgba(138,130,120,0.1)] flex gap-3">
              <button
                onClick={() => setSelectedReservation(null)}
                className="flex-1 py-2.5 border border-[rgba(138,130,120,0.2)] rounded-lg font-body text-sm font-medium text-charcoal hover:border-terracotta hover:text-terracotta transition-colors"
              >
                Cerrar
              </button>
              <button className="flex-1 py-2.5 bg-terracotta text-white rounded-lg font-body text-sm font-medium hover:bg-terracotta-dark transition-colors">
                Editar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
