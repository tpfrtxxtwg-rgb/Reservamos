import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { trpc } from '@/providers/trpc.tsx';
import {
  Buildings, Globe, Phone, EnvelopeSimple,
  Image, Plus, Trash, Check, ArrowCounterClockwise,
  Pencil, Link as LinkIcon, Car, Info,
} from '@phosphor-icons/react';

interface AdminCompanyProfileProps {
  clientId: number;
}

const defaultVehicleTypes = [
  'Suburban', 'Sprinter', 'Van', 'Sedan', 'Minivan',
  'Escalade', 'Navigator', 'Expedition', 'Tahoe', 'Yukon',
  'Bus', 'Limousine', 'Tesla', 'Other',
];

export default function AdminCompanyProfile({ clientId }: AdminCompanyProfileProps) {
  const { t } = useTranslation();
  const utils = trpc.useUtils();

  const { data: profile, isLoading } = trpc.companyProfile.get.useQuery();
  const { data: vehicleImagesList } = trpc.companyProfile.getVehicleImages.useQuery();

  const updateProfile = trpc.companyProfile.update.useMutation({
    onSuccess: () => {
      utils.companyProfile.get.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const upsertVehicleImage = trpc.companyProfile.upsertVehicleImage.useMutation({
    onSuccess: () => {
      utils.companyProfile.getVehicleImages.invalidate();
      setEditingVehicle(null);
    },
  });

  const deleteVehicleImage = trpc.companyProfile.deleteVehicleImage.useMutation({
    onSuccess: () => utils.companyProfile.getVehicleImages.invalidate(),
  });

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [saved, setSaved] = useState(false);

  // Vehicle images state
  const [editingVehicle, setEditingVehicle] = useState<{
    id?: number;
    vehicleType: string;
    imageUrl: string;
  } | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
      setWebsite(profile.website || '');
      setPhone(profile.phone || '');
      setDescription(profile.description || '');
      setLogoUrl(profile.logoUrl || '');
    }
  }, [profile]);

  const handleSaveProfile = () => {
    updateProfile.mutate({
      name,
      email,
      website: website || null,
      phone: phone || null,
      description: description || null,
      logoUrl: logoUrl || null,
    });
  };

  const handleSaveVehicleImage = () => {
    if (!editingVehicle?.vehicleType || !editingVehicle?.imageUrl) return;
    upsertVehicleImage.mutate({
      id: editingVehicle.id,
      vehicleType: editingVehicle.vehicleType,
      imageUrl: editingVehicle.imageUrl,
    });
  };

  const existingTypes = new Set(vehicleImagesList?.map(v => v.vehicleType.toLowerCase()) || []);

  const getPreviewImage = (type: string) => {
    const found = vehicleImagesList?.find(
      v => v.vehicleType.toLowerCase() === type.toLowerCase()
    );
    return found?.imageUrl;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-charcoal">
            {t('admin.companyProfile') || 'Company Profile'}
          </h2>
          <p className="font-body text-sm text-warm-gray mt-1">
            {t('admin.companyProfileDesc') || 'Manage your company information and vehicle images'}
          </p>
        </div>
        <button
          onClick={handleSaveProfile}
          disabled={updateProfile.isPending}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-body text-sm font-medium transition-all ${
            saved
              ? 'bg-[#2D6A4F] text-white'
              : 'bg-terracotta text-white hover:bg-terracotta-dark'
          }`}
        >
          {saved ? <Check size={16} /> : updateProfile.isPending
            ? <ArrowCounterClockwise size={16} className="animate-spin" />
            : null}
          {saved ? 'Saved!' : t('common.save') || 'Save Changes'}
        </button>
      </div>

      {/* Company Info */}
      <div className="bg-white rounded-xl shadow-sm border border-[rgba(138,130,120,0.08)] p-6">
        <div className="flex items-center gap-2 mb-5">
          <Buildings size={18} className="text-terracotta" />
          <h3 className="font-body text-sm font-semibold text-charcoal uppercase tracking-wide">
            {t('admin.companyInfo') || 'Company Information'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Company Name */}
          <div>
            <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
              {t('admin.companyName') || 'Company Name'}
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Transportes Riviera Maya"
              className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta focus:ring-[3px] focus:ring-[rgba(199,94,58,0.1)] outline-none transition-all"
            />
          </div>

          {/* Admin Email */}
          <div>
            <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
              {t('admin.adminEmail') || 'Admin Email'}
            </label>
            <div className="relative">
              <EnvelopeSimple size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@company.com"
                className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-10 pr-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none transition-all"
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
              {t('admin.website') || 'Website'}
            </label>
            <div className="relative">
              <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
              <input
                type="url"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                placeholder="https://company.com"
                className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-10 pr-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none transition-all"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
              {t('admin.phone') || 'Phone Number'}
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+52 998 123 4567"
                className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-10 pr-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none transition-all"
              />
            </div>
          </div>

          {/* Description - full width */}
          <div className="md:col-span-2">
            <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
              {t('admin.description') || 'Company Description'}
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe your transportation services..."
              rows={3}
              className="w-full bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md px-3 py-2 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta focus:ring-[3px] focus:ring-[rgba(199,94,58,0.1)] outline-none transition-all resize-none"
            />
          </div>

          {/* Logo URL */}
          <div className="md:col-span-2">
            <label className="font-body text-xs font-medium text-warm-gray uppercase tracking-wide mb-1.5 block">
              {t('admin.logoUrl') || 'Logo URL'}
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Image size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                <input
                  type="url"
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  placeholder="https://your-cdn.com/logo.png"
                  className="w-full h-11 bg-[#FAFAF8] border border-[rgba(138,130,120,0.2)] rounded-md pl-10 pr-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none transition-all"
                />
              </div>
              {logoUrl && (
                <div className="w-11 h-11 rounded-md border border-[rgba(138,130,120,0.15)] overflow-hidden flex-shrink-0 bg-white">
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Images */}
      <div className="bg-white rounded-xl shadow-sm border border-[rgba(138,130,120,0.08)] p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Car size={18} className="text-terracotta" />
            <h3 className="font-body text-sm font-semibold text-charcoal uppercase tracking-wide">
              {t('admin.vehicleImages') || 'Vehicle Images'}
            </h3>
          </div>
          <button
            onClick={() => setEditingVehicle({ vehicleType: '', imageUrl: '' })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-terracotta text-white rounded-md font-body text-xs hover:bg-terracotta-dark transition-colors"
          >
            <Plus size={14} /> {t('admin.addImage') || 'Add Image'}
          </button>
        </div>

        <p className="font-body text-xs text-warm-gray mb-4 flex items-start gap-1.5">
          <Info size={14} className="flex-shrink-0 mt-0.5" />
          {t('admin.vehicleImagesDesc') || 'Configure the image URLs for each vehicle type used by your company. These images will be shown to customers during vehicle selection.'}
        </p>

        {/* Add/Edit Form */}
        {editingVehicle && (
          <div className="bg-[#FAFAF8] rounded-lg p-4 mb-4 border border-[rgba(138,130,120,0.1)]">
            <h4 className="font-body text-xs font-semibold text-charcoal mb-3">
              {editingVehicle.id
                ? (t('admin.editImage') || 'Edit Vehicle Image')
                : (t('admin.addNewImage') || 'Add New Vehicle Image')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="font-body text-[11px] text-warm-gray mb-1 block">
                  {t('admin.vehicleType') || 'Vehicle Type'}
                </label>
                <input
                  type="text"
                  list="vehicle-types"
                  value={editingVehicle.vehicleType}
                  onChange={e => setEditingVehicle({ ...editingVehicle, vehicleType: e.target.value })}
                  placeholder="Suburban"
                  className="w-full h-10 bg-white border border-[rgba(138,130,120,0.2)] rounded-md px-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none transition-all"
                />
                <datalist id="vehicle-types">
                  {defaultVehicleTypes.map(type => (
                    <option key={type} value={type} />
                  ))}
                </datalist>
              </div>
              <div className="md:col-span-2">
                <label className="font-body text-[11px] text-warm-gray mb-1 block">
                  {t('admin.imageUrl') || 'Image URL'}
                </label>
                <div className="relative">
                  <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                  <input
                    type="url"
                    value={editingVehicle.imageUrl}
                    onChange={e => setEditingVehicle({ ...editingVehicle, imageUrl: e.target.value })}
                    placeholder="https://your-cdn.com/vehicles/suburban.jpg"
                    className="w-full h-10 bg-white border border-[rgba(138,130,120,0.2)] rounded-md pl-9 pr-3 font-body text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta outline-none transition-all"
                  />
                </div>
              </div>
            </div>
            {/* Preview */}
            {editingVehicle.imageUrl && (
              <div className="mt-3">
                <span className="font-body text-[11px] text-warm-gray mb-1 block">Preview</span>
                <div className="w-32 h-20 rounded-lg border border-[rgba(138,130,120,0.15)] overflow-hidden bg-white">
                  <img
                    src={editingVehicle.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = '/vehicle-suburban.jpg'; }}
                  />
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleSaveVehicleImage}
                disabled={!editingVehicle.vehicleType || !editingVehicle.imageUrl || upsertVehicleImage.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-terracotta text-white rounded-md font-body text-xs font-medium hover:bg-terracotta-dark transition-colors disabled:opacity-50"
              >
                <Check size={14} />
                {t('common.save') || 'Save'}
              </button>
              <button
                onClick={() => setEditingVehicle(null)}
                className="px-4 py-2 border border-[rgba(138,130,120,0.2)] rounded-md font-body text-xs text-charcoal hover:bg-sand transition-colors"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
            </div>
          </div>
        )}

        {/* Vehicle Images Table */}
        {vehicleImagesList && vehicleImagesList.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-[rgba(138,130,120,0.08)]">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FAFAF8] border-b border-[rgba(138,130,120,0.08)]">
                  <th className="text-left px-4 py-3 font-body text-[11px] font-medium text-warm-gray uppercase tracking-wide">
                    {t('admin.vehicle') || 'Vehicle'}
                  </th>
                  <th className="text-left px-4 py-3 font-body text-[11px] font-medium text-warm-gray uppercase tracking-wide">
                    {t('admin.preview') || 'Preview'}
                  </th>
                  <th className="text-left px-4 py-3 font-body text-[11px] font-medium text-warm-gray uppercase tracking-wide">
                    {t('admin.imageUrl') || 'Image URL'}
                  </th>
                  <th className="text-right px-4 py-3 font-body text-[11px] font-medium text-warm-gray uppercase tracking-wide">
                    {t('admin.actions') || 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {vehicleImagesList.map((item) => (
                  <tr key={item.id} className="border-b border-[rgba(138,130,120,0.05)] last:border-0 hover:bg-[#FAFAF8]/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-body text-sm font-medium text-charcoal">{item.vehicleType}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-16 h-10 rounded-md border border-[rgba(138,130,120,0.1)] overflow-hidden bg-white">
                        <img
                          src={item.imageUrl}
                          alt={item.vehicleType}
                          className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="font-mono text-[11px] text-warm-gray bg-sand px-2 py-0.5 rounded truncate max-w-[200px] block">
                        {item.imageUrl}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingVehicle({
                            id: item.id,
                            vehicleType: item.vehicleType,
                            imageUrl: item.imageUrl,
                          })}
                          className="p-1.5 text-warm-gray hover:text-terracotta transition-colors rounded"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(t('admin.deleteConfirm') || 'Delete this image?')) {
                              deleteVehicleImage.mutate({ id: item.id });
                            }
                          }}
                          className="p-1.5 text-warm-gray hover:text-[#B23A2F] transition-colors rounded"
                          title="Delete"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !editingVehicle ? (
          <div className="text-center py-8 bg-[#FAFAF8] rounded-lg border border-dashed border-[rgba(138,130,120,0.15)]">
            <Car size={32} className="text-warm-gray/30 mx-auto mb-3" />
            <p className="font-body text-sm text-warm-gray">
              {t('admin.noVehicleImages') || 'No vehicle images configured yet'}
            </p>
            <button
              onClick={() => setEditingVehicle({ vehicleType: '', imageUrl: '' })}
              className="mt-3 text-terracotta font-body text-sm hover:underline"
            >
              {t('admin.addFirstImage') || 'Add your first vehicle image'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
