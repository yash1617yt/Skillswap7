import React, { useContext } from 'react'
import { ThemeContext } from '../context/ThemeContext'
import skillswapLogo from '../assets/skillswap-logo.svg'

const featureGroups = [
  {
    title: 'Learning Features',
    items: [
      'Structured lecture and video-based learning',
      'Course progress tracking with completion percentage',
      'Interactive notes editor during learning',
      'My Notes storage and quick revision flow',
      'Learning activity dashboard with streak and stats',
      'Completion-based course certificate download',
    ],
  },
  {
    title: 'Creator And Mentor Features',
    items: [
      'Upload personal educational videos',
      'Manage uploaded videos from profile',
      'Set visibility as public, private, or premium',
      'Mentor profile and peer learning sessions',
      'Session management for learners and mentors',
      'Review and rating support for teaching quality',
    ],
  },
  {
    title: 'Platform And Account Features',
    items: [
      'Secure login and protected routes',
      'Profile completion and smart profile insights',
      'Followers and following network support',
      'Token economy for learning actions',
      'Invite system to onboard new users',
      'Contact, feedback, and 24/7 support channels',
    ],
  },
]

const deepDiveModules = [
  {
    title: 'Progress And Analytics Module',
    desc: 'Track lectures, videos, notes, completion percentage, streak, and weekly goals in a single live dashboard.',
  },
  {
    title: 'Certificate And Achievement Module',
    desc: 'Generate downloadable certificates for completed courses with learner name, mentor name, and unique certificate ID.',
  },
  {
    title: 'Profile Intelligence Module',
    desc: 'Profile completion scoring, activity heatmap, AI insights, timezone controls, and public/private visibility settings.',
  },
  {
    title: 'Mentor Collaboration Module',
    desc: 'Mentor profiles, peer learning sessions, reviews, ratings, and session tracking for better learner outcomes.',
  },
]

const platformHighlights = [
  'Real-time sync through WebSocket events for progress, activity, and token updates.',
  'Secure route protection for authenticated and admin-only features.',
  'Token-based learning economy to encourage contribution and engagement.',
  'Flexible learning flow with video lectures, notes, and interactive practice.',
  'Dedicated support and invite system for smooth user onboarding.',
  'Feature-rich profile and portfolio experience for learners and mentors.',
]

const useCases = [
  {
    persona: 'Student Use Case',
    details: 'A learner watches lectures, tracks completion, saves notes, and downloads certificates after finishing courses.',
  },
  {
    persona: 'Mentor Use Case',
    details: 'A mentor uploads skill videos, manages sessions, receives reviews, and builds credibility through profile performance.',
  },
  {
    persona: 'Admin Use Case',
    details: 'An admin moderates platform content, manages videos, checks engagement, and maintains quality standards.',
  },
]

const faqs = [
  {
    q: 'When is a certificate available?',
    a: 'A certificate becomes available when lecture or course completion reaches 100%.',
  },
  {
    q: 'Is each course certificate unique?',
    a: 'Yes, each completed course gets a unique certificate ID and course-specific details.',
  },
  {
    q: 'Are notes and progress saved automatically?',
    a: 'Yes, both notes and progress are saved persistently and reflected on the dashboard.',
  },
]

const showcaseImages = [
  {
    title: 'Learning Dashboard Experience',
    src: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80',
    desc: 'Track progress, completion, and consistency in one place.',
  },
  {
    title: 'Video-Based Skill Building',
    src: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80',
    desc: 'Watch practical videos and learn directly from creators.',
  },
  {
    title: 'Peer Learning And Mentorship',
    src: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80',
    desc: 'Connect with mentors, collaborate, and grow your skills.',
  },
  {
    title: 'Live Collaboration Sessions',
    src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80',
    desc: 'Interactive sessions make peer-to-peer skill transfer practical and fast.',
  },
  {
    title: 'Progress And Goal Tracking',
    src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80',
    desc: 'Visual metrics help users stay consistent and measure improvement clearly.',
  },
  {
    title: 'Notes And Revision Workflow',
    src: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1400&q=80',
    desc: 'Capture, organize, and revisit learning notes during every session.',
  },
  {
    title: 'Creator Upload And Management',
    src: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=1400&q=80',
    desc: 'Mentors can publish and manage educational content smoothly.',
  },
  {
    title: 'Achievement And Certification',
    src: 'https://images.unsplash.com/photo-1561489396-888724a1543d?auto=format&fit=crop&w=1400&q=80',
    desc: 'Completion certificates provide motivation and proof of learning.',
  },
]

const Features = () => {
  const { isDark } = useContext(ThemeContext)

  return (
    <div className={`min-h-screen py-10 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        <section className={`rounded-3xl p-8 border ${isDark ? 'bg-slate-900/70 border-slate-700' : 'bg-white border-slate-200'} shadow-xl`}>
          <div className="flex items-center gap-4 mb-4">
            <img src={skillswapLogo} alt="SkillSwap" className="h-12 w-12 rounded-xl bg-white/70 p-1" />
            <h1 className="text-4xl font-extrabold">SkillSwap Features</h1>
          </div>
          <p className={`${isDark ? 'text-slate-300' : 'text-slate-600'} text-lg`}>
            This page presents the key features of the SkillSwap web application in text form, along with images for better visual understanding.
          </p>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {featureGroups.map((group) => (
            <article
              key={group.title}
              className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white border-slate-200'} shadow-lg`}
            >
              <h2 className="text-2xl font-bold mb-4 text-cyan-500">{group.title}</h2>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li key={item} className={`${isDark ? 'text-slate-300' : 'text-slate-700'} leading-relaxed`}>
                    - {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className={`rounded-3xl p-6 border ${isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white border-slate-200'} shadow-xl`}>
          <h2 className="text-3xl font-bold mb-6">Core Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {deepDiveModules.map((module) => (
              <article
                key={module.title}
                className={`rounded-2xl p-5 border ${isDark ? 'border-slate-700 bg-slate-950/50' : 'border-slate-200 bg-slate-50'}`}
              >
                <h3 className="text-xl font-semibold mb-2 text-cyan-500">{module.title}</h3>
                <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'} leading-relaxed`}>{module.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`rounded-3xl p-6 border ${isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white border-slate-200'} shadow-xl`}>
          <h2 className="text-3xl font-bold mb-5">Why SkillSwap</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platformHighlights.map((point) => (
              <div key={point} className={`rounded-xl p-4 ${isDark ? 'bg-slate-950/60' : 'bg-slate-100'}`}>
                <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'}`}>- {point}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={`rounded-3xl p-6 border ${isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white border-slate-200'} shadow-xl`}>
          <h2 className="text-3xl font-bold mb-5">Practical Use Cases</h2>
          <div className="space-y-4">
            {useCases.map((item) => (
              <article key={item.persona} className={`rounded-xl p-5 border-l-4 ${isDark ? 'bg-slate-950/60 border-cyan-500' : 'bg-slate-100 border-cyan-600'}`}>
                <h3 className="text-xl font-semibold mb-2">{item.persona}</h3>
                <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item.details}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`rounded-3xl p-6 border ${isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white border-slate-200'} shadow-xl`}>
          <h2 className="text-3xl font-bold mb-6">Feature Showcase Images</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {showcaseImages.map((item) => (
              <figure key={item.title} className={`rounded-2xl overflow-hidden border ${isDark ? 'border-slate-700 bg-slate-950/60' : 'border-slate-200 bg-slate-100'}`}>
                <img src={item.src} alt={item.title} className="w-full h-48 object-cover" loading="lazy" />
                <figcaption className="p-4">
                  <p className="font-semibold mb-1">{item.title}</p>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.desc}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className={`rounded-3xl p-6 border ${isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white border-slate-200'} shadow-xl`}>
          <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((item) => (
              <article key={item.q} className={`rounded-xl p-5 ${isDark ? 'bg-slate-950/60 border border-slate-700' : 'bg-slate-100 border border-slate-200'}`}>
                <h3 className="text-xl font-semibold mb-2 text-cyan-500">{item.q}</h3>
                <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item.a}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Features
