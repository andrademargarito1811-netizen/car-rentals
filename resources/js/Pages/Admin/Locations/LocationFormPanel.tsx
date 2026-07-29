import { useState } from 'react';
import { AdminLocation } from '@/types/models';
import SlidePanel from '@/Components/SlidePanel';
import FormField from '@/Components/FormField';
import LocationMapPicker from './LocationMapPicker';
import OperatingHoursEditor from './OperatingHoursEditor';
import AmenitiesGrid from './AmenitiesGrid';
import ImageDropzone from './ImageDropzone';
import RichEditor from './RichEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Label } from '@/Components/ui/label';
import { Input } from '@/Components/ui/input';
import {
    Info,
    MapPin,
    Clock,
    Image,
    Plus,
    X,
    GripVertical,
} from 'lucide-react';

interface LocationFormData {
    location: string;
    subtitle: string;
    city: string;
    address: string;
    phone: string;
    hours: string;
    lat: string | number;
    lng: string | number;
    description: string;
    features: string[];
    amenities: string[];
    image: File | null;
    is_active: boolean;
}

interface LocationFormPanelProps {
    show: boolean;
    editingLocation: AdminLocation | null;
    data: LocationFormData;
    setData: (key: keyof LocationFormData, value: any) => void;
    errors: Record<string, string>;
    processing: boolean;
    imagePreview: string | null;
    setImagePreview: (preview: string | null) => void;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
}

function FeatureInput({ features, onChange }: { features: string[]; onChange: (v: string[]) => void }) {
    function addFeature() {
        onChange([...features, '']);
    }

    function updateFeature(i: number, val: string) {
        const f = [...features];
        f[i] = val;
        onChange(f);
    }

    function removeFeature(i: number) {
        const f = [...features];
        f.splice(i, 1);
        onChange(f);
    }

    return (
        <div className="space-y-2">
            {features.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-surface-400 shrink-0" />
                    <input
                        type="text"
                        value={f}
                        onChange={e => updateFeature(i, e.target.value)}
                        placeholder="Feature..."
                        className="flex-1 px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm focus:ring-2 focus:ring-accent-400 focus:border-transparent"
                    />
                    <button
                        type="button"
                        onClick={() => removeFeature(i)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={addFeature} className="text-accent-600">
                <Plus className="w-4 h-4" />
                Add Feature
            </Button>
        </div>
    );
}

export default function LocationFormPanel({
    show,
    editingLocation,
    data,
    setData,
    errors,
    processing,
    imagePreview,
    setImagePreview,
    onClose,
    onSubmit,
}: LocationFormPanelProps) {
    const [activeTab, setActiveTab] = useState('basic');
    const [showMapModal, setShowMapModal] = useState(false);

    const formContent = (
        <form id="location-form" onSubmit={onSubmit}>
            <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid grid-cols-4 h-auto p-1 mb-5">
                    <TabsTrigger value="basic" className="flex items-center gap-1.5 py-2">
                        <Info className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Basic</span>
                    </TabsTrigger>
                    <TabsTrigger value="hours" className="flex items-center gap-1.5 py-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Hours</span>
                    </TabsTrigger>
                    <TabsTrigger value="location" className="flex items-center gap-1.5 py-2">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Location</span>
                    </TabsTrigger>
                    <TabsTrigger value="media" className="flex items-center gap-1.5 py-2">
                        <Image className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Media</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-0">
                    <Card>
                        <CardContent className="p-4 space-y-4">
                            <FormField
                                label="Location Name"
                                required
                                value={data.location}
                                onChange={v => setData('location', v)}
                                error={errors.location}
                                placeholder="e.g. Makati Main Branch"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    label="Subtitle"
                                    value={data.subtitle}
                                    onChange={v => setData('subtitle', v)}
                                    placeholder="e.g. Makati City"
                                />
                                <FormField
                                    label="City"
                                    value={data.city}
                                    onChange={v => setData('city', v)}
                                    placeholder="e.g. Makati"
                                />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 space-y-4">
                            <FormField
                                label="Address"
                                value={data.address}
                                onChange={v => setData('address', v)}
                                placeholder="e.g. 123 Ayala Avenue"
                                error={errors.address}
                            />
                            <FormField
                                label="Phone"
                                type="tel"
                                value={data.phone}
                                onChange={v => setData('phone', v)}
                                placeholder="e.g. +63 2 8123 4567"
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 space-y-4">
                            <AmenitiesGrid
                                selected={data.amenities}
                                onChange={v => setData('amenities', v)}
                            />
                            <div className="flex items-center gap-3 pt-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active as boolean}
                                        onChange={e => setData('is_active', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-surface-200 dark:bg-surface-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-accent-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                                    <span className="ml-3 text-sm font-medium text-surface-700 dark:text-surface-300">
                                        Active
                                    </span>
                                </label>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="hours" className="space-y-5 mt-0">
                    <OperatingHoursEditor
                        value={data.hours}
                        onChange={v => setData('hours', v)}
                    />
                </TabsContent>

                <TabsContent value="location" className="space-y-5 mt-0">
                    <Card>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4" />
                                    Coordinates
                                </Label>
                                <Button type="button" variant="outline" size="sm" onClick={() => setShowMapModal(true)}>
                                    <MapPin className="w-3.5 h-3.5" />
                                    Open Map Picker
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Input
                                        type="number"
                                        step="any"
                                        placeholder="Latitude"
                                        value={data.lat}
                                        onChange={e => setData('lat', e.target.value)}
                                    />
                                    {errors?.lat && <p className="text-xs text-red-500">{errors.lat}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Input
                                        type="number"
                                        step="any"
                                        placeholder="Longitude"
                                        value={data.lng}
                                        onChange={e => setData('lng', e.target.value)}
                                    />
                                    {errors?.lng && <p className="text-xs text-red-500">{errors.lng}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {showMapModal && (
                        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={() => setShowMapModal(false)}>
                            <div className="absolute inset-4 sm:inset-8 bg-white dark:bg-brand-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between px-5 py-3 border-b border-surface-200 dark:border-surface-700 shrink-0">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-bold text-surface-900 dark:text-white">Pick Location on Map</h3>
                                        <span className="hidden sm:inline-flex items-center gap-2 text-xs text-surface-500 bg-surface-100 dark:bg-surface-800 px-2.5 py-1 rounded-lg font-mono">
                                            {data.lat || '—'}, {data.lng || '—'}
                                        </span>
                                    </div>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowMapModal(false)}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="relative flex-1">
                                    <LocationMapPicker
                                        standalone
                                        lat={data.lat}
                                        lng={data.lng}
                                        onLatChange={v => setData('lat', v)}
                                        onLngChange={v => setData('lng', v)}
                                        errors={errors}
                                    />
                                </div>
                                <div className="flex justify-end gap-3 px-5 py-3 border-t border-surface-200 dark:border-surface-700 shrink-0">
                                    <Button type="button" variant="ghost" onClick={() => setShowMapModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="button" variant="accent" className="dark:text-white" onClick={() => setShowMapModal(false)}>
                                        Apply Location
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="media" className="space-y-4 mt-0">
                    <Card>
                        <CardContent className="p-4">
                            <RichEditor
                                label="Description"
                                value={data.description}
                                onChange={v => setData('description', v)}
                                placeholder="Describe this location..."
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 space-y-4">
                            <ImageDropzone
                                imagePreview={imagePreview}
                                onImageChange={v => setData('image', v)}
                                onPreviewChange={setImagePreview}
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-3 block">
                                Features
                            </label>
                            <FeatureInput
                                features={data.features}
                                onChange={v => setData('features', v)}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </form>
    );

    const footer = (
        <>
            <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
            </Button>
            <Button type="submit" disabled={processing} form="location-form" variant="accent" className="dark:text-white">
                {processing ? 'Saving...' : editingLocation ? 'Update Location' : 'Create Location'}
            </Button>
        </>
    );

    return (
        <SlidePanel
            show={show}
            onClose={onClose}
            title={editingLocation ? 'Edit Location' : 'Add Location'}
            footer={footer}
        >
            {formContent}
        </SlidePanel>
    );
}
