import React, { useState } from 'react';
import { Camera, CheckCircle2, Download, LocateFixed, MapPin, Trash2, Upload } from 'lucide-react';
import { POLLUTION_TYPES } from '../data/soilData';
import { PollutionReport, PollutionType } from '../types';

interface ReportPollutionProps {
  reports: PollutionReport[];
  onAddReport: (report: PollutionReport) => void;
  onDeleteReport: (id: string) => void;
}

function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 720;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = () => reject(new Error('Could not decode image'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

export const ReportPollution: React.FC<ReportPollutionProps> = ({
  reports,
  onAddReport,
  onDeleteReport,
}) => {
  const [type, setType] = useState<PollutionType>('Industry');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState('');
  const [description, setDescription] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [photoName, setPhotoName] = useState<string>('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedBanner, setSubmittedBanner] = useState(false);
  const [filterType, setFilterType] = useState<'All' | PollutionType>('All');
  const [exportMessage, setExportMessage] = useState('');

  const triggerDownload = (content: string, mimeType: string, filename: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const escapeCsvCell = (value: string): string => {
    const safe = value.replace(/"/g, '""');
    return `"${safe}"`;
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    try {
      const compressed = await compressImageToDataUrl(file);
      setPhotoDataUrl(compressed);
      setPhotoName(file.name);
    } catch {
      setErrorMsg('Photo load failed. Please pick a JPG or PNG image.');
    }
  };

  const handleDetectGps = () => {
    setGpsLoading(true);
    setGpsStatus('');
    setErrorMsg('');

    if (!navigator.geolocation) {
      setCoordinates('28.6139° N, 77.2090° E');
      if (!location.trim()) setLocation('Delhi NCR (Detected Fallback)');
      setGpsStatus('Browser GPS unavailable — loaded Delhi NCR reference coordinates.');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lng = pos.coords.longitude.toFixed(4);
        const coordString = `${lat}° N, ${lng}° E`;
        setCoordinates(coordString);
        if (!location.trim()) {
          setLocation(`GPS Spot (${lat}, ${lng})`);
        }
        setGpsStatus(`GPS locked: ${coordString}`);
        setGpsLoading(false);
      },
      () => {
        // Graceful fallback if permission denied inside preview iframe
        const fallback = '28.4089° N, 77.3178° E';
        setCoordinates(fallback);
        if (!location.trim()) {
          setLocation('Faridabad Sector 24 / Delhi NCR');
        }
        setGpsStatus('Location permission blocked — filled sample NCR GPS coordinates.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!location.trim()) {
      setErrorMsg('Kripya location daalein ya GPS button dabayein (Please enter a location).');
      return;
    }
    if (description.trim().length < 8) {
      setErrorMsg('Please describe the soil pollution issue in at least a few words.');
      return;
    }

    const newReport: PollutionReport = {
      id: `rep-${Date.now()}`,
      type,
      location: location.trim(),
      coordinates: coordinates || undefined,
      description: description.trim(),
      photoDataUrl: photoDataUrl || undefined,
      createdAt: 'Just now',
      isUserSubmitted: true,
    };

    onAddReport(newReport);
    setSubmittedBanner(true);
    setLocation('');
    setCoordinates('');
    setDescription('');
    setPhotoDataUrl('');
    setPhotoName('');
    setGpsStatus('');
  };

  const filteredReports =
    filterType === 'All' ? reports : reports.filter((item) => item.type === filterType);

  const handleExportCsv = () => {
    if (filteredReports.length === 0) return;
    const headers = ['ID', 'Type', 'Location', 'Coordinates', 'Description', 'Reported', 'PhotoAttached'];
    const rows = filteredReports.map((r) => [
      escapeCsvCell(r.id),
      escapeCsvCell(r.type),
      escapeCsvCell(r.location),
      escapeCsvCell(r.coordinates || ''),
      escapeCsvCell(r.description),
      escapeCsvCell(r.createdAt),
      escapeCsvCell(r.photoDataUrl ? 'Yes' : 'No'),
    ]);
    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const dateStamp = new Date().toISOString().slice(0, 10);
    triggerDownload(csv, 'text/csv;charset=utf-8;', `mittimitra-reports-${dateStamp}.csv`);
    setExportMessage(`Exported ${filteredReports.length} report(s) to CSV.`);
  };

  const handleExportJson = () => {
    if (filteredReports.length === 0) return;
    const payload = filteredReports.map(({ photoDataUrl, ...rest }) => ({
      ...rest,
      hasPhoto: Boolean(photoDataUrl),
    }));
    const dateStamp = new Date().toISOString().slice(0, 10);
    triggerDownload(
      JSON.stringify(payload, null, 2),
      'application/json;charset=utf-8;',
      `mittimitra-reports-${dateStamp}.json`
    );
    setExportMessage(`Exported ${filteredReports.length} report(s) to JSON.`);
  };

  return (
    <section id="report" className="py-12 sm:py-16 border-t border-[#E2D9C8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs sm:text-sm font-medium text-[#5D4037]">
            Citizen Vigilance · प्रदूषण की शिकायत दर्ज करें
          </p>
          <h2 className="mt-1 font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#2C1E18]">
            Report Soil Pollution
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#5C473D]">
            Spot illegal dumping, factory effluent, or e-waste burning? Log it with photo &amp; GPS
            so local communities stay alert. Saved locally on your device. 📍
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Submission Form */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-5 rounded-2xl bg-[#FFFFFF] border border-[#E2D9C8] p-5 sm:p-6 space-y-5"
          >
            {submittedBanner && (
              <div
                role="status"
                className="rounded-xl bg-[#E8F5E9] border border-[#A5D6A7] p-4 flex items-start gap-3 text-[#1B5E20]"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Report Submitted ✅</p>
                  <p className="text-xs text-[#2E7D32] mt-0.5">
                    Dhanyavaad! Your soil alert is saved in LocalStorage and visible in the feed.
                  </p>
                </div>
              </div>
            )}

            {errorMsg && (
              <div
                role="alert"
                className="rounded-xl bg-[#FDECEA] border border-[#F5C2C0] p-3.5 text-sm text-[#8D1E1E]"
              >
                {errorMsg}
              </div>
            )}

            {/* Photo Upload */}
            <div>
              <label
                htmlFor="pollution-photo"
                className="block text-sm font-semibold text-[#2C1E18] mb-2"
              >
                📸 Site Photo (Optional)
              </label>
              <label
                htmlFor="pollution-photo"
                className="flex items-center justify-between gap-3 min-h-[48px] px-4 py-3 rounded-xl border border-dashed border-[#BFA98E] bg-[#FAF7F0] hover:bg-[#F3EDE0] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5 text-sm text-[#4E342E] truncate">
                  <Camera className="w-4 h-4 shrink-0 text-[#2E7D32]" />
                  <span className="truncate">
                    {photoName ? photoName : 'Upload or capture site photo'}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B5E20] shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  Browse
                </span>
                <input
                  id="pollution-photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="sr-only"
                />
              </label>

              {photoDataUrl && (
                <div className="mt-3 relative rounded-xl overflow-hidden border border-[#E2D9C8] h-36">
                  <img
                    src={photoDataUrl}
                    alt="Uploaded soil pollution preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoDataUrl('');
                      setPhotoName('');
                    }}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-[#2C1E18]/80 text-[#FAF7F0] text-xs font-medium cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Location + GPS */}
            <div>
              <label
                htmlFor="pollution-location"
                className="block text-sm font-semibold text-[#2C1E18] mb-2"
              >
                📍 Location / Village / Ward
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  id="pollution-location"
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setSubmittedBanner(false);
                  }}
                  placeholder="e.g., Okhla Phase II, Delhi"
                  className="flex-1 min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D4C7AE] bg-[#FAF7F0] text-sm text-[#2C1E18] placeholder:text-[#8C776B] focus:outline-none focus:border-[#2E7D32]"
                />
                <button
                  type="button"
                  onClick={handleDetectGps}
                  disabled={gpsLoading}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#EFE7D6] hover:bg-[#E4D9C1] border border-[#D4C7AE] text-sm font-semibold text-[#2C1E18] inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                >
                  <LocateFixed className="w-4 h-4 text-[#2E7D32]" />
                  <span>{gpsLoading ? 'Locating...' : 'Use GPS'}</span>
                </button>
              </div>
              {gpsStatus && (
                <p className="mt-1.5 text-xs text-[#1B5E20] font-mono-num">{gpsStatus}</p>
              )}
            </div>

            {/* Pollution Type Dropdown */}
            <div>
              <label
                htmlFor="pollution-type"
                className="block text-sm font-semibold text-[#2C1E18] mb-2"
              >
                ⚠️ Pollution Type
              </label>
              <select
                id="pollution-type"
                value={type}
                onChange={(e) => {
                  setType(e.target.value as PollutionType);
                  setSubmittedBanner(false);
                }}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D4C7AE] bg-[#FAF7F0] text-sm text-[#2C1E18] focus:outline-none focus:border-[#2E7D32]"
              >
                {POLLUTION_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.emoji} {item.value} — {item.hint}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="pollution-description"
                className="block text-sm font-semibold text-[#2C1E18] mb-2"
              >
                📝 Description (Kya dekha aapne?)
              </label>
              <textarea
                id="pollution-description"
                rows={3}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setSubmittedBanner(false);
                }}
                placeholder="Describe chemical smell, plastic dumping, burnt wires, or soil discoloration..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4C7AE] bg-[#FAF7F0] text-sm text-[#2C1E18] placeholder:text-[#8C776B] focus:outline-none focus:border-[#2E7D32]"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-[#FAF7F0] font-semibold text-sm sm:text-base transition-colors cursor-pointer"
            >
              Submit Soil Report
            </button>
          </form>

          {/* Submitted Reports Feed */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#2C1E18]">
                    Community Soil Reports ({filteredReports.length})
                  </h3>
                  <p className="text-xs text-[#6E584D]">
                    Live feed stored in browser LocalStorage
                  </p>
                </div>

                {/* Export Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    disabled={filteredReports.length === 0}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#EFE7D6] border border-[#D4C7AE] text-xs font-semibold text-[#2C1E18] inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-[#2E7D32]" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportJson}
                    disabled={filteredReports.length === 0}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#EFE7D6] border border-[#D4C7AE] text-xs font-semibold text-[#2C1E18] inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-[#5D4037]" />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>

              {exportMessage && (
                <p role="status" className="text-xs font-medium text-[#1B5E20]">
                  ✅ {exportMessage}
                </p>
              )}

              {/* Functional interactive filter controls */}
              <div className="flex flex-wrap items-center gap-1.5 bg-[#EFE7D6] p-1 rounded-xl self-start">
                {(['All', 'Industry', 'Urban Waste', 'Farming', 'E-Waste'] as const).map(
                  (filterOption) => (
                    <button
                      key={filterOption}
                      type="button"
                      onClick={() => {
                        setFilterType(filterOption);
                        setExportMessage('');
                      }}
                      className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                        filterType === filterOption
                          ? 'bg-[#FFFFFF] text-[#2C1E18] shadow-xs'
                          : 'text-[#5C473D] hover:text-[#2C1E18]'
                      }`}
                    >
                      {filterOption}
                    </button>
                  )
                )}
              </div>
            </div>

            {filteredReports.length === 0 ? (
              <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D9C8] p-8 text-center">
                <p className="text-base font-semibold text-[#2C1E18]">
                  No reports under "{filterType}" yet 🌱
                </p>
                <p className="text-sm text-[#6E584D] mt-1">
                  Switch filter to "All" or submit a new report using the form.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredReports.map((report) => {
                  const typeMeta = POLLUTION_TYPES.find((p) => p.value === report.type);
                  return (
                    <article
                      key={report.id}
                      className="rounded-2xl bg-[#FFFFFF] border border-[#E2D9C8] overflow-hidden flex flex-col"
                    >
                      {report.photoDataUrl ? (
                        <div className="h-40 bg-[#EFE7D6] overflow-hidden">
                          <img
                            src={report.photoDataUrl}
                            alt={`Reported ${report.type} soil issue at ${report.location}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-24 bg-[#F3EDE0] px-5 flex items-center justify-between border-b border-[#E2D9C8]">
                          <span className="text-2xl" aria-hidden="true">
                            {typeMeta?.emoji || '🌍'}
                          </span>
                          <span className="text-xs font-medium text-[#6E584D]">
                            Field Observation Log
                          </span>
                        </div>
                      )}

                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-center justify-between gap-2 text-xs text-[#6E584D]">
                          <span className="font-semibold text-[#5D4037]">
                            {typeMeta?.emoji} {report.type}
                          </span>
                          <span>{report.createdAt}</span>
                        </div>

                        <h4 className="mt-2 font-display text-base font-bold text-[#2C1E18] flex items-start gap-1.5">
                          <MapPin className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
                          <span>{report.location}</span>
                        </h4>

                        {report.coordinates && (
                          <p className="mt-1 text-xs text-[#6E584D] font-mono-num">
                            {report.coordinates}
                          </p>
                        )}

                        <p className="mt-2.5 text-sm text-[#4E342E] leading-relaxed flex-1">
                          {report.description}
                        </p>

                        {report.isUserSubmitted && (
                          <div className="mt-4 pt-3 border-t border-[#F0E9DA] flex items-center justify-between text-xs">
                            <span className="text-[#1B5E20] font-medium">Saved on this device</span>
                            <button
                              type="button"
                              onClick={() => onDeleteReport(report.id)}
                              className="inline-flex items-center gap-1 text-[#8D3B1B] hover:text-[#6B2710] font-medium cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
