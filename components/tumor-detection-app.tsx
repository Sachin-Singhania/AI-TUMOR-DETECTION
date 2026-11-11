'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowDown, ArrowRight, ArrowUpRight, Activity, Brain, ChevronRight, CircleHelp, FileImage, FileJson2, Fingerprint, LockKeyhole, Microscope, RotateCcw, ScanLine, ShieldCheck, Upload, X } from 'lucide-react'
import { predictTumor, type TumorPrediction } from '@/actions/api/predict'

type Result = TumorPrediction

const steps = [
  { number: '01', icon: Upload, title: 'Upload a scan', text: 'Add a brain MRI image in PNG, JPG, or WEBP format.' },
  { number: '02', icon: ScanLine, title: 'AI-assisted review', text: 'Your image is sent to the configured AI service for analysis.' },
  { number: '03', icon: Activity, title: 'Review the result', text: 'Explore the returned classification and confidence estimate with a clinician.' },
]

export function TumorDetectionApp() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [rawResponse, setRawResponse] = useState<unknown>(null)
  const [analysisError, setAnalysisError] = useState('')
  const [showJson, setShowJson] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [uploadError, setUploadError] = useState('')

  function selectFile(next?: File) {
    if (!next) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(next.type)) {
      setUploadError('Please choose a PNG, JPG, or WEBP image.')
      return
    }
    if (next.size > 20 * 1024 * 1024) {
      setUploadError('This image is larger than the 20 MB limit.')
      return
    }
    setUploadError('')
    if (preview) URL.revokeObjectURL(preview)
    setFile(next)
    setPreview(URL.createObjectURL(next))
    setResult(null)
    setRawResponse(null)
    setAnalysisError('')
    setShowJson(false)
    setUploadError('')
  }

  function reset() {
    if (preview) URL.revokeObjectURL(preview)
    setPreview('')
    setFile(null)
    setResult(null)
    setRawResponse(null)
    setAnalysisError('')
    setShowJson(false)
    setLoading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function analyze() {
    if (!file || loading) return
    setLoading(true)
    setAnalysisError('')
    setResult(null)
    setRawResponse(null)
    setShowJson(false)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await predictTumor(formData)
      if (!response.ok) {
        setAnalysisError(response.error)
        return
      }
      setResult(response.prediction)
      setRawResponse(response.raw)
    } catch {
      setAnalysisError('Something went wrong while analyzing the image. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="NeuroSight home"><span className="brand-mark"><Brain size={18} strokeWidth={1.7} /></span><span>neuro<span className="brand-light">sight</span><sup>AI</sup></span></a>
        <nav className="nav-links" aria-label="Main navigation"><a href="#process">How it works</a><a href="#analyzer">Image analyzer</a></nav>
        <a className="nav-cta" href="#analyzer">Open analyzer <ArrowUpRight size={15} /></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-grid" />
        <div className="hero-copy">
          <div className="eyebrow"><span className="status-dot" /> MEDICAL IMAGING, REIMAGINED</div>
          <h1>Clarity for<br />the <span>complex.</span></h1>
          <p className="hero-description">A closer look at brain imaging, powered by an AI service. Explore an intuitive screening workflow built to support—not replace—clinical expertise.</p>
          <div className="hero-actions"><a className="button-primary" href="#analyzer">Explore the analyzer <ArrowRight size={16} /></a><a className="button-quiet" href="#process">Discover the process <ArrowDown size={15} /></a></div>
          <div className="hero-footnote"><ShieldCheck size={15} /> AI service powered <span className="foot-divider" /> Educational demo</div>
        </div>
        <div className="hero-visual" aria-label="Illustrative brain MRI scan">
          <div className="visual-halo" />
          <Image src="/brain-scan.png" alt="Illustrative cyan brain MRI scan" fill priority className="brain-image" sizes="(max-width: 800px) 90vw, 55vw" />
          <div className="scan-frame scan-frame-top"><span>NEURO / 01</span><span>AXIAL VIEW</span></div>
          <div className="scan-frame scan-frame-bottom"><span className="scan-line-icon"><ScanLine size={15} /></span><span>IMAGING<br /><b>INTELLIGENCE</b></span><span className="scan-coords">40° 42′ 46.2″ N<br />74° 00′ 21.0″ W</span></div>
          <div className="floating-chip"><span className="chip-dot" /> NEURAL NETWORK <span className="chip-divider" /> ACTIVE</div>
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
        </div>
        <div className="hero-bottom"><span>01 — 03</span><span>SCROLL TO EXPLORE</span><span>EST. FOR BETTER INSIGHT</span></div>
      </section>

      <section className="process-section" id="process">
        <div className="section-heading"><div><div className="eyebrow muted-eyebrow">A THOUGHTFUL WORKFLOW</div><h2>From image to <span>insight.</span></h2></div><p>Designed to make complex imaging workflows feel clear, considered, and human.</p></div>
        <div className="process-line" aria-hidden="true"><span /><span /><span /></div>
        <div className="steps-grid">{steps.map(({ number, icon: Icon, title, text }) => <article className="step-card" key={number}><div className="step-top"><span>{number}</span><Icon size={20} strokeWidth={1.5} /></div><h3>{title}</h3><p>{text}</p><ChevronRight className="step-arrow" size={17} /></article>)}</div>
        <div className="process-note"><Fingerprint size={15} /><span>Every scan deserves thoughtful, human-centered care.</span></div>
      </section>

      <section className="analyzer-section" id="analyzer">
        <div className="analyzer-heading"><div><div className="eyebrow muted-eyebrow">AI-ASSISTED SCREENING</div><h2>Image <span>analyzer.</span></h2><p>Upload an MRI image to request a prediction from the configured medical imaging service.</p></div><div className="secure-label"><LockKeyhole size={14} /> AI SERVICE</div></div>
        <div className="workspace">
          <div className="upload-panel">
            <div className="panel-topline"><span><span className="tiny-square" /> IMAGE INPUT</span><span>01 / 01</span></div>
            {!preview ? <button className={`dropzone ${dragging ? 'is-dragging' : ''}`} onClick={() => inputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); selectFile(e.dataTransfer.files[0]) }} aria-label="Choose or drop an image to upload"><span className="upload-icon"><Upload size={21} /></span><strong>Drop your scan here</strong><span>or <u>browse files</u> to upload</span><span className="file-types">PNG, JPG, WEBP <i /> MAX 20 MB</span>{uploadError && <span className="upload-error" role="alert">{uploadError}</span>}</button> : <div className="image-preview"><Image src={preview} alt={`Preview of ${file?.name ?? 'uploaded scan'}`} fill unoptimized sizes="(max-width: 700px) 100vw, 50vw" /><div className="preview-overlay"><span><FileImage size={14} /> {file?.name}</span><button onClick={reset} aria-label="Remove selected image"><X size={15} /></button></div>{loading && <div className="scan-overlay"><div className="scan-sweep" /><span><ScanLine size={17} /> ANALYZING MRI</span></div>}</div>}
            <input ref={inputRef} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => selectFile(e.target.files?.[0])} aria-label="Select an image file" />
            <div className="upload-footer"><span><LockKeyhole size={13} /> Sent to AI service for analysis</span>{file && <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>}</div>
          </div>
          <div className="result-panel">
            <div className="panel-topline"><span><span className="tiny-square cyan-square" /> ANALYSIS OUTPUT</span><span>{result ? 'COMPLETE' : loading ? 'PROCESSING' : analysisError ? 'SERVICE ERROR' : 'AWAITING INPUT'}</span></div>
            {!result && !loading ? <div className="result-empty"><div className="empty-orbit"><Microscope size={23} strokeWidth={1.4} /><span /></div><h3>Your results, thoughtfully presented.</h3><p>{analysisError || 'Upload an image to request an analysis from the AI service.'}</p><div className="output-placeholder"><span>CLASSIFICATION</span><i /><span>CONFIDENCE</span><i /></div></div> : loading ? <div className="result-loading" role="status"><div className="loader-ring"><ScanLine size={24} /></div><strong>Analyzing your image</strong><span>Waiting for the AI service response</span></div> : <div className="result-content" aria-live="polite"><div className="result-status"><span className="result-icon"><CircleHelp size={18} /></span><span><small>STATUS</small><b>{result?.tumor ? 'Tumor detected' : 'Tumor not detected'}</b></span></div><div className="result-class"><span>CLASSIFICATION</span><h3>{result?.type}</h3></div><div className="confidence-row"><span>CONFIDENCE SCORE</span><span className="confidence-value">{result?.confidence.toFixed(2)}%</span></div><div className="confidence-track"><span style={{ width: `${result?.confidence ?? 0}%` }} /></div><div className="result-disclaimer">This AI-generated result is for informational support only and is not a diagnosis.</div><button className="json-toggle" onClick={() => setShowJson(!showJson)} aria-expanded={showJson}><FileJson2 size={15} /> {showJson ? 'Hide' : 'Inspect'} raw JSON <span>{showJson ? '−' : '+'}</span></button>{showJson && <pre className="json-output">{JSON.stringify(rawResponse, null, 2)}</pre>}</div>}
            <div className="result-actions">{result ? <button className="button-secondary" onClick={reset}><RotateCcw size={15} /> Start over</button> : <button className="analyze-button" onClick={analyze} disabled={!file || loading}>{loading ? <><span className="button-spinner" /> Analyzing MRI…</> : <>Analyze MRI <ArrowRight size={16} /></>}</button>}</div>
          </div>
        </div>
        <p className="medical-notice"><span>IMPORTANT</span> AI-generated results are not a diagnosis and are not a substitute for professional medical advice. Always consult a qualified healthcare professional.</p>
      </section>
      <footer className="footer"><a className="brand" href="#top"><span className="brand-mark"><Brain size={16} /></span><span>neuro<span className="brand-light">sight</span><sup>AI</sup></span></a><span>DESIGNED FOR A MORE HUMAN VIEW OF HEALTH.</span><a href="#top">BACK TO TOP ↑</a></footer>
    </main>
  )
}
