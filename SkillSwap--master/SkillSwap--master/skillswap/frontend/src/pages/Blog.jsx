import React, { useContext, useState } from 'react'
import { ThemeContext } from '../context/ThemeContext'

const Blog = () => {
  const { isDark } = useContext(ThemeContext)
  const [expandedPostIndex, setExpandedPostIndex] = useState(null)

  const posts = [
    {
      title: 'Getting Started with SkillSwap',
      excerpt: 'Learn how to create an account and start your learning journey on SkillSwap.',
      date: 'Jan 15, 2024',
      author: 'Admin',
      details: 'Start by completing your profile with your learning goals, preferred language, and timezone so recommendations and analytics stay accurate. After setup, pick one beginner-friendly track and follow a weekly schedule instead of jumping between multiple topics. Inside each course, watch lectures with notes enabled, summarize every key concept in 2-3 lines, and create one practical action item you can apply the same day. Use the activity tab to monitor your time spent, streak consistency, and contribution patterns over the last 7 days. The best onboarding strategy is: complete one course fully, revise notes once, apply learning in a mini project, and then move to the next skill. This creates momentum and improves retention far better than passive watching.'
    },
    {
      title: 'Maximizing Your Learning with Notes',
      excerpt: 'Tips and tricks for effective note-taking and knowledge retention.',
      date: 'Jan 10, 2024',
      author: 'Sarah',
      details: 'Great notes are short, structured, and action-oriented. While watching a lecture, divide your notes into four parts: concept, example, mistake to avoid, and quick task. Keep each point concise so revision becomes faster later. At the end of every lecture, write a 5-minute recap in your own words; this step alone improves understanding significantly. Once a week, review all notes and turn repeated weak areas into a focused practice checklist. If a topic feels difficult, add one real-world example from your own project to make it memorable. Over time, your notes become a personal playbook that helps in interviews, project execution, and long-term revision without rewatching every video.'
    },
    {
      title: 'Becoming a Great Teacher',
      excerpt: 'How to create engaging lecture content and earn tokens by teaching others.',
      date: 'Jan 5, 2024',
      author: 'John',
      details: 'Effective teaching on SkillSwap is about clarity, consistency, and practical outcomes. Begin every lecture with 3 clear goals so learners know exactly what they will achieve. Keep modules short and focused around one core concept, followed by a demo and a small task. Explain not only what to do, but why that approach works, and where beginners usually make mistakes. Use progressive difficulty: basics first, then application, then challenge tasks. Encourage learners to submit simple outputs so they stay engaged and accountable. Review feedback regularly and improve your next lecture based on confusion points. Teachers who iterate content and keep examples practical typically see better completion rates, stronger learner trust, and healthier token earnings over time.'
    },
    {
      title: 'Token Economy Explained',
      excerpt: 'Understanding how the token-based economy works and how to optimize your spending.',
      date: 'Dec 28, 2023',
      author: 'Admin',
      details: 'The token system is designed to reward meaningful learning and contribution. You spend tokens for premium actions and earn them by staying active, completing learning tasks, and contributing value. To optimize usage, prioritize high-impact courses that directly align with your current goal instead of spending tokens randomly. Track token inflow and outflow weekly from your analytics to understand where value is being created or lost. A simple strategy works well: reserve a base token balance, spend only on priority learning items, and recover balance through consistent completion and contribution activities. Learners who treat tokens like a learning budget usually progress faster and avoid interruptions caused by poor planning.'
    },
  ]

  const togglePostDetails = (idx) => {
    setExpandedPostIndex((prev) => (prev === idx ? null : idx))
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} py-12`}>
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-12">SkillSwap Blog</h1>

        <div className="space-y-8">
          {posts.map((post, idx) => (
            <article
              key={idx}
              className={`rounded-lg p-8 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg hover:shadow-xl transition cursor-pointer`}
            >
              <h2 className="text-2xl font-bold mb-3">{post.title}</h2>
              <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                By <strong>{post.author}</strong> on {post.date}
              </p>
              <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {post.excerpt}
              </p>
              {expandedPostIndex === idx && (
                <div className={`mb-4 rounded-md p-4 border ${isDark ? 'bg-gray-700/50 border-gray-600 text-gray-200' : 'bg-blue-50 border-blue-100 text-gray-700'}`}>
                  <p className="leading-relaxed">{post.details}</p>
                </div>
              )}
              <button
                onClick={() => togglePostDetails(idx)}
                className="text-blue-600 hover:underline font-semibold"
              >
                {expandedPostIndex === idx ? 'Show Less ↑' : 'Read More →'}
              </button>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Blog
