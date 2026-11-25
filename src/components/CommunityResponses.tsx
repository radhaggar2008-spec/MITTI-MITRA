import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Lightbulb,
  LogIn,
  LogOut,
  Pencil,
  Search,
  Trash2,
  Upload,
  Users,
  Wrench,
} from 'lucide-react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  CommunityResponse,
  RespondentRole,
  ResponseSummary,
  SoilPledge,
} from '../types';

const ROLES: { value: RespondentRole; label: string; hindi: string; emoji: string }[] = [
  { value: 'Student', label: 'Student', hindi: 'विद्यार्थी', emoji: '🎓' },
  { value: 'Teacher', label: 'Teacher', hindi: 'शिक्षक', emoji: '👩‍🏫' },
  { value: 'Other', label: 'Other', hindi: 'अन्य / नागरिक', emoji: '🌱' },
];

const PLEDGES: SoilPledge[] = [
  'Compost Kitchen Waste',
  'Carry Cloth Bag',
  'Plant Native Sapling',
  'Stop Waste Burning',
  'Test & Share Soil Health',
];

function formatTimestamp(ts: unknown): string {
  if (!ts) return 'Just now';
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts) {
    try {
      const date = (ts as { toDate: () => Date }).toDate();
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  }
  return 'Recently';
}

function compressEcoActionImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 480;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const qualities = [0.72, 0.56, 0.42, 0.3];
        for (const q of qualities) {
          const dataUrl = canvas.toDataURL('image/jpeg', q);
          if (dataUrl.length <= 150000) {
            resolve(dataUrl);
            return;
          }
        }
        reject(new Error('Image is still too large after compression. Please pick a smaller image.'));
      };
      img.onerror = () => reject(new Error('Could not decode image file.'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}

export const CommunityResponses: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [summary, setSummary] = useState<ResponseSummary>({
    totalCount: 0,
    studentCount: 0,
    teacherCount: 0,
    otherCount: 0,
    lastResponseId: '',
  });
  const [responses, setResponses] = useState<CommunityResponse[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  // Form states
  const [role, setRole] = useState<RespondentRole>('Student');
  const [roleDetail, setRoleDetail] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [city, setCity] = useState('');
  const [pledge, setPledge] = useState<SoilPledge>('Compost Kitchen Waste');
  const [soilAwarenessRating, setSoilAwarenessRating] = useState<number>(4);
  const [message, setMessage] = useState('');
  const [problemsFaced, setProblemsFaced] = useState('');
  const [whatCanBeDone, setWhatCanBeDone] = useState('');
  const [problemImage, setProblemImage] = useState('');
  const [problemPhotoName, setProblemPhotoName] = useState('');
  const [advice, setAdvice] = useState('');
  const [ecoActionImage, setEcoActionImage] = useState('');
  const [ecoPhotoName, setEcoPhotoName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Sub-tab state ('form' | 'tracker')
  const [activeTab, setActiveTab] = useState<'form' | 'tracker'>('form');

  // Tracker filter states
  const [roleFilter, setRoleFilter] = useState<'All' | RespondentRole>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [exportNotice, setExportNotice] = useState('');

  // Listen to Firebase Auth state and resolve admin status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        setName((prev) => prev || (nextUser.displayName || '').slice(0, 80));
      }

      if (nextUser && nextUser.emailVerified) {
        if (nextUser.email === BOOTSTRAPPED_ADMIN_EMAIL) {
          setIsAdmin(true);
        } else {
          try {
            const adminDoc = await getDoc(doc(db, 'admins', nextUser.uid));
            setIsAdmin(adminDoc.exists());
          } catch {
            setIsAdmin(false);
          }
        }
      } else {
        setIsAdmin(false);
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Listen to zero-PII public summary counts (/stats/summary)
  useEffect(() => {
    const summaryRef = doc(db, 'stats', 'summary');
    const unsubscribe = onSnapshot(
      summaryRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as ResponseSummary;
          setSummary({
            totalCount: data.totalCount ?? 0,
            studentCount: data.studentCount ?? 0,
            teacherCount: data.teacherCount ?? 0,
            otherCount: data.otherCount ?? 0,
            lastResponseId: data.lastResponseId ?? '',
          });
        } else {
          setSummary({
            totalCount: 0,
            studentCount: 0,
            teacherCount: 0,
            otherCount: 0,
            lastResponseId: '',
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'stats/summary');
      }
    );

    return () => unsubscribe();
  }, []);

  // Listen to /responses only after auth is ready & verified
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      setResponses([]);
      setLoadingResponses(false);
      return;
    }

    setLoadingResponses(true);
    const responsesCol = collection(db, 'responses');
    const q = isAdmin
      ? query(responsesCol, orderBy('createdAt', 'desc'))
      : query(responsesCol, where('authorUid', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: CommunityResponse[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CommunityResponse, 'id'>),
        }));

        if (!isAdmin) {
          items.sort((a, b) => {
            const aTime =
              a.createdAt && typeof a.createdAt === 'object' && 'seconds' in a.createdAt
                ? (a.createdAt as { seconds: number }).seconds
                : 0;
            const bTime =
              b.createdAt && typeof b.createdAt === 'object' && 'seconds' in b.createdAt
                ? (b.createdAt as { seconds: number }).seconds
                : 0;
            return bTime - aTime;
          });
        }

        setResponses(items);
        setLoadingResponses(false);
      },
      (error) => {
        setLoadingResponses(false);
        handleFirestoreError(error, OperationType.LIST, 'responses');
      }
    );

    return () => unsubscribe();
  }, [authReady, user, isAdmin]);

  const handleGoogleSignIn = async () => {
    setFormError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in cancelled or blocked.';
      setFormError(`Could not sign in: ${msg}`);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setEditingId(null);
    setSuccessNotice('');
  };

  const resetFormFields = () => {
    setRole('Student');
    setRoleDetail('');
    setOrganization('');
    setCity('');
    setPledge('Compost Kitchen Waste');
    setSoilAwarenessRating(4);
    setMessage('');
    setProblemsFaced('');
    setWhatCanBeDone('');
    setProblemImage('');
    setProblemPhotoName('');
    setAdvice('');
    setEcoActionImage('');
    setEcoPhotoName('');
    setEditingId(null);
  };

  const handleProblemPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError('');
    try {
      const compressed = await compressEcoActionImage(file);
      setProblemImage(compressed);
      setProblemPhotoName(file.name);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Photo upload failed. Please pick a JPG or PNG image.'
      );
    }
  };

  const handleEcoPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError('');
    try {
      const compressed = await compressEcoActionImage(file);
      setEcoActionImage(compressed);
      setEcoPhotoName(file.name);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Photo upload failed. Please pick a JPG or PNG image.'
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessNotice('');

    const cleanName = name.trim().slice(0, 80);
    const cleanCity = city.trim().slice(0, 60);
    const cleanMessage = message.trim().slice(0, 500);
    const cleanProblemsFaced = problemsFaced.trim().slice(0, 500);
    const cleanWhatCanBeDone = whatCanBeDone.trim().slice(0, 500);
    const cleanAdvice = advice.trim().slice(0, 500);
    const cleanOrg = organization.trim().slice(0, 100);
    const cleanRoleDetail = roleDetail.trim().slice(0, 40);

    if (cleanName.length < 2) {
      setFormError('Please enter your name (at least 2 characters).');
      return;
    }
    if (cleanCity.length < 2) {
      setFormError('Please enter your city or district (e.g., Delhi, Faridabad, Karnal).');
      return;
    }
    if (cleanMessage.length < 5) {
      setFormError('Please fill in your observation or feedback (at least 5 characters).');
      return;
    }

    setSubmitting(true);

    // Ensure respondent is authenticated with Google (prompts cleanly on submit if not yet signed in)
    let activeUser = user;
    if (!activeUser || !activeUser.emailVerified) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        activeUser = result.user;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Google sign-in was cancelled.';
        setFormError(`Sign-in needed to save your response: ${msg}`);
        setSubmitting(false);
        return;
      }
    }

    if (!activeUser || !activeUser.emailVerified) {
      setFormError('A verified Google account is required to submit the form.');
      setSubmitting(false);
      return;
    }

    if (editingId) {
      const targetPath = `responses/${editingId}`;
      try {
        const updatePayload: Record<string, unknown> = {
          name: cleanName,
          role,
          city: cleanCity,
          pledge,
          soilAwarenessRating,
          message: cleanMessage,
          problemsFaced: cleanProblemsFaced,
          whatCanBeDone: cleanWhatCanBeDone,
          advice: cleanAdvice,
          updatedAt: serverTimestamp(),
        };
        if (problemImage && problemImage.length <= 160000) {
          updatePayload.problemImage = problemImage;
        } else if (!problemImage) {
          updatePayload.problemImage = deleteField();
        }
        if (ecoActionImage && ecoActionImage.length <= 160000) {
          updatePayload.ecoActionImage = ecoActionImage;
        } else if (!ecoActionImage) {
          updatePayload.ecoActionImage = deleteField();
        }
        if (role === 'Other' && cleanRoleDetail) {
          updatePayload.roleDetail = cleanRoleDetail;
        }
        if (cleanOrg) {
          updatePayload.organization = cleanOrg;
        }
        await updateDoc(doc(db, 'responses', editingId), updatePayload);
        setSuccessNotice('Your response, problem notes, advice, and photos were updated.');
        resetFormFields();
      } catch (error) {
        setSubmitting(false);
        handleFirestoreError(error, OperationType.UPDATE, targetPath);
      }
      setSubmitting(false);
      return;
    }

    // Create new response + atomically update /stats/summary in a single batch
    const newResponseRef = doc(collection(db, 'responses'));
    const summaryRef = doc(db, 'stats', 'summary');

    try {
      const summarySnap = await getDoc(summaryRef);
      const batch = writeBatch(db);

      const responseDoc: Record<string, unknown> = {
        authorUid: activeUser.uid,
        name: cleanName,
        role,
        city: cleanCity,
        pledge,
        soilAwarenessRating,
        message: cleanMessage,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (cleanProblemsFaced) {
        responseDoc.problemsFaced = cleanProblemsFaced;
      }
      if (cleanWhatCanBeDone) {
        responseDoc.whatCanBeDone = cleanWhatCanBeDone;
      }
      if (problemImage && problemImage.length <= 160000) {
        responseDoc.problemImage = problemImage;
      }
      if (cleanAdvice) {
        responseDoc.advice = cleanAdvice;
      }
      if (ecoActionImage && ecoActionImage.length <= 160000) {
        responseDoc.ecoActionImage = ecoActionImage;
      }
      if (role === 'Other' && cleanRoleDetail) {
        responseDoc.roleDetail = cleanRoleDetail;
      }
      if (cleanOrg) {
        responseDoc.organization = cleanOrg;
      }

      batch.set(newResponseRef, responseDoc);

      if (!summarySnap.exists()) {
        batch.set(summaryRef, {
          totalCount: 1,
          studentCount: role === 'Student' ? 1 : 0,
          teacherCount: role === 'Teacher' ? 1 : 0,
          otherCount: role === 'Other' ? 1 : 0,
          lastResponseId: newResponseRef.id,
          updatedAt: serverTimestamp(),
        });
      } else {
        const cur = summarySnap.data() as ResponseSummary;
        batch.update(summaryRef, {
          totalCount: (cur.totalCount ?? 0) + 1,
          studentCount: (cur.studentCount ?? 0) + (role === 'Student' ? 1 : 0),
          teacherCount: (cur.teacherCount ?? 0) + (role === 'Teacher' ? 1 : 0),
          otherCount: (cur.otherCount ?? 0) + (role === 'Other' ? 1 : 0),
          lastResponseId: newResponseRef.id,
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();
      setSuccessNotice('Form Submitted — your response and soil advice are saved!');
      resetFormFields();
    } catch (error) {
      setSubmitting(false);
      handleFirestoreError(error, OperationType.WRITE, `responses/${newResponseRef.id}`);
    }

    setSubmitting(false);
  };

  const handleMarkReviewed = async (item: CommunityResponse) => {
    if (!isAdmin) return;
    const nextStatus = item.status === 'reviewed' ? 'pending' : 'reviewed';
    try {
      await updateDoc(doc(db, 'responses', item.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `responses/${item.id}`);
    }
  };

  const handleDeleteResponse = async (item: CommunityResponse) => {
    try {
      await deleteDoc(doc(db, 'responses', item.id));
      if (isAdmin) {
        const remaining = responses.filter((r) => r.id !== item.id);
        const summaryRef = doc(db, 'stats', 'summary');
        const batch = writeBatch(db);
        batch.set(summaryRef, {
          totalCount: remaining.length,
          studentCount: remaining.filter((r) => r.role === 'Student').length,
          teacherCount: remaining.filter((r) => r.role === 'Teacher').length,
          otherCount: remaining.filter((r) => r.role === 'Other').length,
          lastResponseId: remaining[0]?.id || item.id,
          updatedAt: serverTimestamp(),
        });
        await batch.commit();
      }
      if (editingId === item.id) {
        resetFormFields();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `responses/${item.id}`);
    }
  };

  const handleStartEdit = (item: CommunityResponse) => {
    setEditingId(item.id);
    setRole(item.role);
    setRoleDetail(item.roleDetail || '');
    setName(item.name);
    setOrganization(item.organization || '');
    setCity(item.city);
    setPledge(item.pledge);
    setSoilAwarenessRating(item.soilAwarenessRating);
    setMessage(item.message);
    setProblemsFaced(item.problemsFaced || '');
    setWhatCanBeDone(item.whatCanBeDone || '');
    setProblemImage(item.problemImage || '');
    setProblemPhotoName(item.problemImage ? 'Attached problem/solution photo' : '');
    setAdvice(item.advice || '');
    setEcoActionImage(item.ecoActionImage || '');
    setEcoPhotoName(item.ecoActionImage ? 'Attached eco action photo' : '');
    setFormError('');
    setSuccessNotice('');
    setActiveTab('form');
  };

  const filteredResponses = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return responses.filter((item) => {
      if (roleFilter !== 'All' && item.role !== roleFilter) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q) ||
        (item.organization || '').toLowerCase().includes(q) ||
        (item.roleDetail || '').toLowerCase().includes(q) ||
        item.pledge.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q) ||
        (item.problemsFaced || '').toLowerCase().includes(q) ||
        (item.whatCanBeDone || '').toLowerCase().includes(q) ||
        (item.advice || '').toLowerCase().includes(q)
      );
    });
  }, [responses, roleFilter, searchTerm]);

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

  const handleExportCsv = () => {
    if (filteredResponses.length === 0) return;
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const headers = [
      'ID',
      'Name',
      'Role',
      'RoleDetail',
      'Organization',
      'City',
      'Pledge',
      'AwarenessRating',
      'Message',
      'ProblemsFaced',
      'WhatCanBeDone',
      'HasProblemPhoto',
      'Advice',
      'HasEcoPhoto',
      'Status',
      'SubmittedDate',
    ];
    const rows = filteredResponses.map((r) => [
      esc(r.id),
      esc(r.name),
      esc(r.role),
      esc(r.roleDetail || ''),
      esc(r.organization || ''),
      esc(r.city),
      esc(r.pledge),
      String(r.soilAwarenessRating),
      esc(r.message),
      esc(r.problemsFaced || ''),
      esc(r.whatCanBeDone || ''),
      esc(r.problemImage ? 'Yes' : 'No'),
      esc(r.advice || ''),
      esc(r.ecoActionImage ? 'Yes' : 'No'),
      esc(r.status),
      esc(formatTimestamp(r.createdAt)),
    ]);
    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const dateStamp = new Date().toISOString().slice(0, 10);
    triggerDownload(csv, 'text/csv;charset=utf-8;', `mittimitra-responses-${dateStamp}.csv`);
    setExportNotice(`Exported ${filteredResponses.length} response(s) to CSV.`);
  };

  const handleExportJson = () => {
    if (filteredResponses.length === 0) return;
    const payload = filteredResponses.map((r) => ({
      id: r.id,
      name: r.name,
      role: r.role,
      roleDetail: r.roleDetail || '',
      organization: r.organization || '',
      city: r.city,
      pledge: r.pledge,
      soilAwarenessRating: r.soilAwarenessRating,
      message: r.message,
      problemsFaced: r.problemsFaced || '',
      whatCanBeDone: r.whatCanBeDone || '',
      hasProblemPhoto: Boolean(r.problemImage),
      advice: r.advice || '',
      hasEcoActionPhoto: Boolean(r.ecoActionImage),
      status: r.status,
      submittedDate: formatTimestamp(r.createdAt),
    }));
    const dateStamp = new Date().toISOString().slice(0, 10);
    triggerDownload(
      JSON.stringify(payload, null, 2),
      'application/json;charset=utf-8;',
      `mittimitra-responses-${dateStamp}.json`
    );
    setExportNotice(`Exported ${filteredResponses.length} response(s) to JSON.`);
  };

  const displayCounts = isAdmin
    ? {
        total: responses.length,
        students: responses.filter((r) => r.role === 'Student').length,
        teachers: responses.filter((r) => r.role === 'Teacher').length,
        others: responses.filter((r) => r.role === 'Other').length,
      }
    : {
        total: summary.totalCount,
        students: summary.studentCount,
        teachers: summary.teacherCount,
        others: summary.otherCount,
      };

  return (
    <section id="responses" className="py-12 sm:py-16 border-t border-[#E2D9C8] bg-[#FAF7F0]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs sm:text-sm font-medium text-[#5D4037]">
              SoilGuard Form &amp; Advice Box · विद्यार्थी, शिक्षक एवं नागरिक फॉर्म
            </p>
            <h2 className="mt-1 font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#2C1E18]">
              Community Response Form &amp; Tracker
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#5C473D]">
              Students, teachers, farmers, and citizens can fill out this form to share local soil
              observations and practical soil-saving advice. 📝
            </p>
          </div>

          {/* Auth Status Control */}
          <div className="shrink-0">
            {user ? (
              <div className="flex flex-wrap items-center gap-3 rounded-xl bg-[#FFFFFF] border border-[#E2D9C8] px-3.5 py-2">
                <div className="text-xs">
                  <p className="font-semibold text-[#2C1E18]">
                    {user.displayName || user.email}
                  </p>
                  <p className="text-[#5C473D]">
                    {isAdmin ? 'Coordinator Tracker Access' : 'Signed-in Respondent'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#EFE7D6] hover:bg-[#E4D9C1] text-xs font-semibold text-[#2C1E18] inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-[#FAF7F0] text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Participation Summary Strip */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D9C8] p-4 sm:p-5">
            <p className="text-xs font-medium text-[#6E584D]">Total Responses</p>
            <p className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-[#2C1E18] font-mono-num">
              {displayCounts.total}
            </p>
          </div>
          <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D9C8] p-4 sm:p-5">
            <p className="text-xs font-medium text-[#6E584D]">🎓 Students</p>
            <p className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-[#1B5E20] font-mono-num">
              {displayCounts.students}
            </p>
          </div>
          <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D9C8] p-4 sm:p-5">
            <p className="text-xs font-medium text-[#6E584D]">👩‍🏫 Teachers</p>
            <p className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-[#5D4037] font-mono-num">
              {displayCounts.teachers}
            </p>
          </div>
          <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D9C8] p-4 sm:p-5">
            <p className="text-xs font-medium text-[#6E584D]">🌱 Others</p>
            <p className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-[#8D5A1B] font-mono-num">
              {displayCounts.others}
            </p>
          </div>
        </div>

        {/* Sub-tab switcher: Dedicated Form Tab vs Tracked Responses Tab */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#EFE7D6] border border-[#DFD4BC]">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`min-h-[42px] px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'form'
                  ? 'bg-[#FFFFFF] text-[#1B5E20] shadow-xs'
                  : 'text-[#5C473D] hover:text-[#2C1E18]'
              }`}
            >
              📝 Fill Response Form &amp; Advice Box
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tracker')}
              className={`min-h-[42px] px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'tracker'
                  ? 'bg-[#FFFFFF] text-[#1B5E20] shadow-xs'
                  : 'text-[#5C473D] hover:text-[#2C1E18]'
              }`}
            >
              📊 Tracked Responses ({user ? filteredResponses.length : displayCounts.total})
            </button>
          </div>
        </div>

        <div className="mt-6">
          {/* Tab 1: Dedicated Fillable Response + Advice Box Form */}
          {activeTab === 'form' && (
          <form
            onSubmit={handleSubmit}
            className="max-w-3xl mx-auto rounded-2xl bg-[#FFFFFF] border border-[#E2D9C8] p-5 sm:p-8 space-y-5"
          >
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#EFE7D6]">
              <div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-[#2C1E18]">
                  {editingId ? 'Edit Your Response' : 'Fill SoilGuard Response Form'}
                </h3>
                <p className="text-xs text-[#6E584D] mt-0.5">
                  All fields marked * are required · Takes 1 minute
                </p>
              </div>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetFormFields}
                  className="text-xs font-semibold text-[#8D3B1B] hover:underline cursor-pointer"
                >
                  Cancel Edit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resetFormFields}
                  className="text-xs font-medium text-[#6E584D] hover:text-[#2C1E18] cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {successNotice && (
              <div
                role="status"
                className="rounded-xl bg-[#E8F5E9] border border-[#A5D6A7] p-3.5 flex items-start gap-2.5 text-sm text-[#1B5E20]"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{successNotice}</span>
              </div>
            )}

            {formError && (
              <div
                role="alert"
                className="rounded-xl bg-[#FDECEA] border border-[#F5C2C0] p-3.5 text-sm text-[#8D1E1E]"
              >
                {formError}
              </div>
            )}

            {/* Step 1: Role Selector */}
            <div>
              <span className="block text-sm font-semibold text-[#2C1E18] mb-2">
                1. I am a... (आप कौन हैं?) *
              </span>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((item) => {
                  const active = role === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setRole(item.value)}
                      className={`min-h-[52px] px-2.5 py-2 rounded-xl border text-center transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#2E7D32] border-[#1B5E20] text-[#FAF7F0]'
                          : 'bg-[#FAF7F0] border-[#E2D9C8] hover:bg-[#EFE7D6] text-[#2C1E18]'
                      }`}
                    >
                      <p className="text-xs sm:text-sm font-bold whitespace-nowrap">
                        {item.emoji} {item.label}
                      </p>
                      <p
                        className={`text-[11px] truncate ${
                          active ? 'text-[#DCEEDC]' : 'text-[#6E584D]'
                        }`}
                      >
                        {item.hindi}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {role === 'Other' && (
              <div>
                <label
                  htmlFor="resp-role-detail"
                  className="block text-sm font-semibold text-[#2C1E18] mb-1.5"
                >
                  Specify Role (Optional — Farmer, Parent, Volunteer, etc.)
                </label>
                <input
                  id="resp-role-detail"
                  type="text"
                  maxLength={40}
                  value={roleDetail}
                  onChange={(e) => setRoleDetail(e.target.value)}
                  placeholder="e.g., Farmer / Parent / Resident"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D4C7AE] bg-[#FAF7F0] text-sm text-[#2C1E18] focus:outline-none focus:border-[#2E7D32]"
                />
              </div>
            )}

            {/* Step 2: Name & City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="resp-name"
                  className="block text-sm font-semibold text-[#2C1E18] mb-1.5"
                >
                  2. Full Name *
                </label>
                <input
                  id="resp-name"
                  type="text"
                  required
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Riya Sharma"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D4C7AE] bg-[#FAF7F0] text-sm text-[#2C1E18] focus:outline-none focus:border-[#2E7D32]"
                />
              </div>

              <div>
                <label
                  htmlFor="resp-city"
                  className="block text-sm font-semibold text-[#2C1E18] mb-1.5"
                >
                  3. City / District *
                </label>
                <input
                  id="resp-city"
                  type="text"
                  required
                  maxLength={60}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g., Faridabad"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D4C7AE] bg-[#FAF7F0] text-sm text-[#2C1E18] focus:outline-none focus:border-[#2E7D32]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="resp-org"
                className="block text-sm font-semibold text-[#2C1E18] mb-1.5"
              >
                4. School / College / Community (Optional)
              </label>
              <input
                id="resp-org"
                type="text"
                maxLength={100}
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g., DAV Public School, Sector 14"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D4C7AE] bg-[#FAF7F0] text-sm text-[#2C1E18] focus:outline-none focus:border-[#2E7D32]"
              />
            </div>

            <div>
              <label
                htmlFor="resp-pledge"
                className="block text-sm font-semibold text-[#2C1E18] mb-1.5"
              >
                5. Soil Protection Pledge 🌱
              </label>
              <select
                id="resp-pledge"
                value={pledge}
                onChange={(e) => setPledge(e.target.value as SoilPledge)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D4C7AE] bg-[#FAF7F0] text-sm text-[#2C1E18] focus:outline-none focus:border-[#2E7D32]"
              >
                {PLEDGES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-sm font-semibold text-[#2C1E18] mb-2">
                6. Local Soil Health Score (1 = Poor, 5 = Healthy)
              </span>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setSoilAwarenessRating(rating)}
                    className={`min-h-[42px] rounded-xl border font-mono-num text-sm font-bold cursor-pointer transition-colors ${
                      soilAwarenessRating === rating
                        ? 'bg-[#3E2723] border-[#2C1E18] text-[#FAF7F0]'
                        : 'bg-[#FAF7F0] border-[#D4C7AE] text-[#2C1E18] hover:bg-[#EFE7D6]'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="resp-message"
                className="block text-sm font-semibold text-[#2C1E18] mb-1.5"
              >
                7. Your Observation / Feedback *
              </label>
              <textarea
                id="resp-message"
                required
                rows={3}
                maxLength={500}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share what you observed about soil quality or pollution near your school, farm, or ward..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4C7AE] bg-[#FAF7F0] text-sm text-[#2C1E18] focus:outline-none focus:border-[#2E7D32]"
              />
            </div>

            {/* Problems Faced, What Can Be Done & Supporting Image */}
            <div className="rounded-xl bg-[#FDF6EC] border border-[#E6CFA8] p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-[#6E3B12] inline-flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0" />
                  <span>8. Problems Faced &amp; What Can Be Done (समस्या और समाधान)</span>
                </span>
                <span className="text-[11px] text-[#7D5836]">Optional · Field Report</span>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label
                    htmlFor="resp-problems-faced"
                    className="text-xs sm:text-sm font-semibold text-[#2C1E18]"
                  >
                    Problems Faced in Your Area (सामना की गई समस्याएँ)
                  </label>
                  <span className="text-[11px] font-mono-num text-[#7D5836]">
                    {problemsFaced.length}/500
                  </span>
                </div>
                <textarea
                  id="resp-problems-faced"
                  rows={2}
                  maxLength={500}
                  value={problemsFaced}
                  onChange={(e) => setProblemsFaced(e.target.value)}
                  placeholder="e.g., Plastic & e-waste dumping near drain, chemical runoff, or open garbage burning..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFC7A1] bg-[#FFFFFF] text-sm text-[#2C1E18] placeholder:text-[#8A7465] focus:outline-none focus:border-[#B45309]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label
                    htmlFor="resp-what-can-be-done"
                    className="text-xs sm:text-sm font-semibold text-[#2C1E18] inline-flex items-center gap-1.5"
                  >
                    <Wrench className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
                    <span>What Can Be Done (क्या किया जा सकता है?)</span>
                  </label>
                  <span className="text-[11px] font-mono-num text-[#7D5836]">
                    {whatCanBeDone.length}/500
                  </span>
                </div>
                <textarea
                  id="resp-what-can-be-done"
                  rows={2}
                  maxLength={500}
                  value={whatCanBeDone}
                  onChange={(e) => setWhatCanBeDone(e.target.value)}
                  placeholder="e.g., Set up separate wet/dry dustbins, clean the plot with school eco-club, or plant mustard..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFC7A1] bg-[#FFFFFF] text-sm text-[#2C1E18] placeholder:text-[#8A7465] focus:outline-none focus:border-[#2E7D32]"
                />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="resp-problem-photo"
                    className="text-xs sm:text-sm font-semibold text-[#2C1E18] inline-flex items-center gap-1.5"
                  >
                    <Camera className="w-4 h-4 text-[#B45309] shrink-0" />
                    <span>Upload Image of Problem Faced / Solution Plan (Optional)</span>
                  </label>
                  <span className="text-[11px] text-[#7D5836]">समस्या / समाधान फोटो</span>
                </div>

                <label
                  htmlFor="resp-problem-photo"
                  className="flex flex-col items-center justify-center gap-1.5 min-h-[96px] px-4 py-3.5 rounded-xl border-2 border-dashed border-[#D6B88C] bg-[#FFFFFF] hover:bg-[#FAF1E2] transition-colors cursor-pointer text-center"
                >
                  <Upload className="w-5 h-5 text-[#B45309]" />
                  <p className="text-xs sm:text-sm font-semibold text-[#2C1E18]">
                    {problemPhotoName
                      ? `Selected: ${problemPhotoName}`
                      : 'Click to upload a photo showing the soil problem or proposed fix'}
                  </p>
                  <p className="text-[11px] text-[#6E584D]">
                    JPG, PNG, or WebP · Automatically compressed for fast saving
                  </p>
                  <input
                    id="resp-problem-photo"
                    type="file"
                    accept="image/*"
                    onChange={handleProblemPhotoChange}
                    className="sr-only"
                  />
                </label>

                {problemImage && (
                  <div className="relative rounded-xl overflow-hidden border border-[#DFC7A1] h-44 bg-[#EFE7D6]">
                    <img
                      src={problemImage}
                      alt="Uploaded problem or solution preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setProblemImage('');
                        setProblemPhotoName('');
                      }}
                      className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-[#2C1E18]/85 text-[#FAF7F0] text-xs font-medium cursor-pointer"
                    >
                      Remove Photo
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Dedicated Advice Box */}
            <div className="rounded-xl bg-[#EEF7EE] border border-[#B9DFBA] p-4">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label
                  htmlFor="resp-advice"
                  className="text-sm font-bold text-[#1B5E20] inline-flex items-center gap-1.5"
                >
                  <Lightbulb className="w-4 h-4 shrink-0" />
                  <span>9. Advice Box (मिट्टी बचाने की सलाह)</span>
                </label>
                <span className="text-[11px] font-mono-num text-[#2E7D32]">
                  {advice.length}/500
                </span>
              </div>
              <p className="text-xs text-[#2C3E2D] mb-2">
                Write a tip, suggestion, or message for students, teachers, and farmers on how to
                protect our soil.
              </p>
              <textarea
                id="resp-advice"
                rows={3}
                maxLength={500}
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                placeholder="e.g., Start a compost pit in school gardens, stop plastic burning, and grow mustard on barren plots..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#A5D6A7] bg-[#FFFFFF] text-sm text-[#2C1E18] placeholder:text-[#7D685C] focus:outline-none focus:border-[#1B5E20]"
              />
            </div>

            {/* Eco Action Photo Upload Box inside Response Form */}
            <div className="rounded-xl bg-[#FAF7F0] border border-[#D4C7AE] p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="resp-eco-photo"
                  className="text-sm font-bold text-[#2C1E18] inline-flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4 text-[#2E7D32] shrink-0" />
                  <span>10. Upload Image of Eco Actions Taken (Optional)</span>
                </label>
                <span className="text-[11px] text-[#6E584D]">हरित कार्य की फोटो</span>
              </div>

              <label
                htmlFor="resp-eco-photo"
                className="flex flex-col items-center justify-center gap-1.5 min-h-[104px] px-4 py-4 rounded-xl border-2 border-dashed border-[#BFA98E] bg-[#FFFFFF] hover:bg-[#F3EDE0] transition-colors cursor-pointer text-center"
              >
                <Upload className="w-5 h-5 text-[#2E7D32]" />
                <p className="text-xs sm:text-sm font-semibold text-[#2C1E18]">
                  {ecoPhotoName
                    ? `Selected: ${ecoPhotoName}`
                    : 'Click to upload a photo of your compost, sapling, cloth bag, or cleanup'}
                </p>
                <p className="text-[11px] text-[#6E584D]">
                  JPG, PNG, or WebP · Automatically compressed for fast saving
                </p>
                <input
                  id="resp-eco-photo"
                  type="file"
                  accept="image/*"
                  onChange={handleEcoPhotoChange}
                  className="sr-only"
                />
              </label>

              {ecoActionImage && (
                <div className="relative rounded-xl overflow-hidden border border-[#E2D9C8] h-44 bg-[#EFE7D6]">
                  <img
                    src={ecoActionImage}
                    alt="Uploaded eco action preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setEcoActionImage('');
                      setEcoPhotoName('');
                    }}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-[#2C1E18]/85 text-[#FAF7F0] text-xs font-medium cursor-pointer"
                  >
                    Remove Photo
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-[#FAF7F0] font-semibold text-sm sm:text-base transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting
                  ? 'Saving Form...'
                  : editingId
                    ? 'Update Form Response'
                    : user
                      ? 'Submit Form Response'
                      : 'Sign in with Google & Submit Form'}
              </button>
              {!user && (
                <p className="text-[11px] text-center text-[#6E584D]">
                  Fill all fields above—clicking Submit will verify your Google account and save
                  your response directly to Cloud Firestore.
                </p>
              )}
            </div>
          </form>
          )}

          {/* Tab 2: Response Tracker List */}
          {activeTab === 'tracker' && (
          <div className="space-y-5">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#2C1E18] flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#2E7D32]" />
                    <span>
                      {isAdmin ? 'All Tracked Responses' : 'Your Submitted Responses'} (
                      {filteredResponses.length})
                    </span>
                  </h3>
                  <p className="text-xs text-[#6E584D]">
                    {isAdmin
                      ? 'Coordinator view · Filter by Student, Teacher, or Other and export records'
                      : 'Sign in as coordinator to track all participants, or view your own submissions here'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    disabled={filteredResponses.length === 0}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#EFE7D6] border border-[#D4C7AE] text-xs font-semibold text-[#2C1E18] inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-[#2E7D32]" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportJson}
                    disabled={filteredResponses.length === 0}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#EFE7D6] border border-[#D4C7AE] text-xs font-semibold text-[#2C1E18] inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-[#5D4037]" />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>

              {exportNotice && (
                <p role="status" className="text-xs font-medium text-[#1B5E20]">
                  ✅ {exportNotice}
                </p>
              )}

              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
                <div className="flex flex-wrap items-center gap-1 bg-[#EFE7D6] p-1 rounded-xl self-start">
                  {(['All', 'Student', 'Teacher', 'Other'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setRoleFilter(tab);
                        setExportNotice('');
                      }}
                      className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                        roleFilter === tab
                          ? 'bg-[#FFFFFF] text-[#2C1E18] shadow-xs'
                          : 'text-[#5C473D] hover:text-[#2C1E18]'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="w-4 h-4 text-[#7D685C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name, school, advice..."
                    aria-label="Search tracked responses"
                    className="w-full min-h-[40px] pl-9 pr-3 py-1.5 rounded-xl border border-[#D4C7AE] bg-[#FFFFFF] text-xs sm:text-sm text-[#2C1E18] focus:outline-none focus:border-[#2E7D32]"
                  />
                </div>
              </div>
            </div>

            {!user ? (
              <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D9C8] p-8 text-center">
                <p className="font-display text-lg font-bold text-[#2C1E18]">
                  Switch to Fill Response Form anytime 📝
                </p>
                <p className="text-sm text-[#5C473D] mt-1 max-w-md mx-auto">
                  Live totals above update for everyone. Sign in with Google to view your saved
                  submissions or access the coordinator response tracker.
                </p>
              </div>
            ) : loadingResponses ? (
              <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D9C8] p-8 text-center text-sm text-[#5C473D]">
                Loading tracked responses...
              </div>
            ) : filteredResponses.length === 0 ? (
              <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D9C8] p-8 text-center">
                <p className="font-display text-base font-bold text-[#2C1E18]">
                  No responses match this view yet 🌱
                </p>
                <p className="text-sm text-[#6E584D] mt-1">
                  Use the Fill Response Form &amp; Advice Box tab to record the first entry.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredResponses.map((item) => {
                  const roleEmoji =
                    item.role === 'Student' ? '🎓' : item.role === 'Teacher' ? '👩‍🏫' : '🌱';
                  const isReviewed = item.status === 'reviewed';
                  return (
                    <article
                      key={item.id}
                      className="rounded-2xl bg-[#FFFFFF] border border-[#E2D9C8] p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E584D]">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-[#5D4037]">
                            {roleEmoji} {item.role}
                            {item.role === 'Other' && item.roleDetail ? ` (${item.roleDetail})` : ''}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{item.city}</span>
                          <span aria-hidden="true">·</span>
                          <span>{formatTimestamp(item.createdAt)}</span>
                        </div>

                        <span
                          className={`font-semibold ${
                            isReviewed ? 'text-[#1B5E20]' : 'text-[#8D5A1B]'
                          }`}
                        >
                          {isReviewed ? '✓ Reviewed' : 'Pending Review'}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                        <h4 className="font-display text-base sm:text-lg font-bold text-[#2C1E18]">
                          {item.name}
                          {item.organization ? (
                            <span className="font-normal text-sm text-[#5C473D]">
                              {' '}
                              · {item.organization}
                            </span>
                          ) : null}
                        </h4>

                        <span className="font-mono-num text-xs font-semibold text-[#1B5E20]">
                          Soil Score: {item.soilAwarenessRating}/5
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-[#4E342E] leading-relaxed">{item.message}</p>

                      {(item.problemsFaced || item.whatCanBeDone || item.problemImage) && (
                        <div className="mt-3 rounded-xl bg-[#FDF6EC] border border-[#E6CFA8] px-3.5 py-3 space-y-2 text-sm text-[#4E342E]">
                          {item.problemsFaced && (
                            <div>
                              <p className="text-xs font-bold text-[#9A4009] inline-flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>Problems Faced</span>
                              </p>
                              <p className="mt-0.5 leading-relaxed">{item.problemsFaced}</p>
                            </div>
                          )}

                          {item.whatCanBeDone && (
                            <div>
                              <p className="text-xs font-bold text-[#1B5E20] inline-flex items-center gap-1">
                                <Wrench className="w-3.5 h-3.5 shrink-0" />
                                <span>What Can Be Done</span>
                              </p>
                              <p className="mt-0.5 leading-relaxed">{item.whatCanBeDone}</p>
                            </div>
                          )}

                          {item.problemImage && (
                            <div className="rounded-xl overflow-hidden border border-[#DFC7A1] bg-[#FAF7F0] max-w-md">
                              <img
                                src={item.problemImage}
                                alt={`Problem or proposed solution shared by ${item.name}`}
                                referrerPolicy="no-referrer"
                                className="w-full max-h-56 object-cover"
                              />
                              <p className="px-3 py-1.5 text-[11px] font-medium text-[#6E3B12] border-t border-[#DFC7A1]">
                                📸 Problem / Proposed Solution Photo
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {item.advice && (
                        <div className="mt-3 rounded-xl bg-[#EEF7EE] border border-[#C6DFC7] px-3.5 py-2.5 text-sm text-[#1B431E]">
                          <p className="text-xs font-bold text-[#1B5E20] inline-flex items-center gap-1">
                            <Lightbulb className="w-3.5 h-3.5" />
                            <span>Soil Advice</span>
                          </p>
                          <p className="mt-0.5 leading-relaxed">{item.advice}</p>
                        </div>
                      )}

                      {item.ecoActionImage && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-[#E2D9C8] bg-[#FAF7F0] max-w-md">
                          <img
                            src={item.ecoActionImage}
                            alt={`Eco action photo shared by ${item.name}`}
                            referrerPolicy="no-referrer"
                            className="w-full max-h-56 object-cover"
                          />
                          <p className="px-3 py-1.5 text-[11px] font-medium text-[#5D4037] border-t border-[#E2D9C8]">
                            📸 Eco Action Photo Proof
                          </p>
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-[#F0E9DA] flex flex-wrap items-center justify-between gap-3 text-xs">
                        <span className="font-medium text-[#2E7D32]">
                          Pledge: {item.pledge}
                        </span>

                        <div className="flex items-center gap-3">
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleMarkReviewed(item)}
                              className="inline-flex items-center gap-1 font-semibold text-[#1B5E20] hover:underline cursor-pointer"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                              <span>{isReviewed ? 'Reopen' : 'Mark Reviewed'}</span>
                            </button>
                          )}

                          {user && item.authorUid === user.uid && !isReviewed && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              className="inline-flex items-center gap-1 font-semibold text-[#5D4037] hover:underline cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                          )}

                          {(isAdmin || (user && item.authorUid === user.uid)) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteResponse(item)}
                              className="inline-flex items-center gap-1 font-semibold text-[#8D3B1B] hover:underline cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </section>
  );
};
