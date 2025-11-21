'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

// Hardcoded blog posts with full content
const blogPosts: Record<string, any> = {
  'fortnite-account-safety-guide-2024': {
    slug: 'fortnite-account-safety-guide-2024',
    title: 'The Complete Guide to Fortnite Account Safety in 2024',
    excerpt: 'Learn essential tips to protect your Fortnite account from scammers, secure your V-Bucks, and maintain account integrity when buying or selling.',
    category: 'Guides',
    game: 'Fortnite',
    author: 'Nashflare Team',
    date: '2024-11-15',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop',
    tags: ['Fortnite', 'Account Safety', 'Security'],
    content: `
# Introduction

Fortnite accounts have become valuable digital assets, with rare skins, emotes, and substantial V-Bucks balances making them attractive targets for scammers. Whether you're buying, selling, or simply maintaining your account, understanding proper security measures is crucial.

## Understanding Account Value

Your Fortnite account's value goes beyond just cosmetics:

- **Rare Battle Pass Skins**: Exclusive items from past seasons that can never be obtained again
- **V-Bucks Balance**: The primary currency that can be used for purchases
- **Account Level**: Progress and achievements accumulated over time
- **Limited Edition Items**: Collaboration skins and event-exclusive items

## Essential Security Measures

### 1. Enable Two-Factor Authentication (2FA)

Two-factor authentication is your first line of defense. Epic Games offers multiple 2FA options:

- **Authenticator App**: The most secure option using apps like Google Authenticator
- **Email Verification**: Receive codes via email
- **SMS Verification**: Get codes via text message

**How to enable 2FA:**
1. Visit Epic Games account settings
2. Navigate to "Password & Security"
3. Select your preferred 2FA method
4. Follow the setup instructions

### 2. Use Strong, Unique Passwords

A strong password should include:
- At least 12 characters
- Mix of uppercase and lowercase letters
- Numbers and special symbols
- No personal information
- Unique to your Epic Games account

**Pro Tip**: Use a password manager like LastPass or 1Password to generate and store complex passwords securely.

### 3. Secure Your Email Account

Your Epic Games account is only as secure as the email linked to it:

- Enable 2FA on your email account
- Use a separate, secure email for gaming accounts
- Regularly check for suspicious login attempts
- Keep your email password unique and strong

## Buying Fortnite Accounts Safely

### Red Flags to Watch For

When purchasing a Fortnite account, be wary of:

- **Prices too good to be true**: If it seems impossible, it probably is
- **No verification process**: Legitimate sellers will verify ownership
- **Pressure to buy immediately**: Scammers create artificial urgency
- **Requests for unusual payment methods**: Stick to secure, trackable payments
- **Poor communication**: Professional sellers maintain clear communication

### Best Practices for Buyers

1. **Use Trusted Marketplaces**: Platforms like Nashflare offer buyer protection and escrow services
2. **Verify Account Details**: Request screenshots and proof of ownership
3. **Check Account History**: Look for bans, warnings, or suspicious activity
4. **Use Secure Payment Methods**: Payment platforms with buyer protection
5. **Change Credentials Immediately**: Update password and enable 2FA upon receipt

### The 48-Hour Protection Window

Most reputable marketplaces offer a protection period:

- **Verify all items are as described**
- **Test account access and functionality**
- **Check for any restrictions or bans**
- **Report issues immediately to support**

## Selling Fortnite Accounts Safely

### Preparing Your Account for Sale

Before listing your account:

1. **Document Everything**: Take screenshots of all skins, emotes, V-Bucks
2. **Remove Personal Information**: Unlink payment methods and personal data
3. **Be Transparent**: Disclose any bans, warnings, or issues
4. **Set Fair Pricing**: Research similar accounts for realistic pricing

### During the Sale Process

- **Use Escrow Services**: Ensure payment is secured before transferring
- **Verify Buyer Information**: Check ratings and transaction history
- **Communicate Clearly**: Maintain professional, documented communication
- **Transfer Properly**: Follow platform guidelines for account transfer

### After the Sale

- **Confirm Payment Receipt**: Ensure funds are received before final transfer
- **Provide All Credentials**: Give complete access information
- **Maintain Records**: Keep transaction documentation for disputes
- **Follow Platform Rules**: Complete all required post-sale steps

## Common Scams and How to Avoid Them

### The "Too Good to Be True" Scam

**How it works**: Scammers list accounts with rare skins at impossibly low prices to attract victims quickly.

**How to avoid**: If pricing seems unrealistic compared to market value, investigate thoroughly or pass on the deal.

### The Account Recovery Scam

**How it works**: Seller provides access but later recovers the account through Epic Games support.

**How to avoid**: Use marketplaces with anti-recovery guarantees and change all credentials immediately.

### The Fake Payment Proof Scam

**How it works**: Scammer sends fake payment confirmation screenshots to convince sellers to transfer accounts.

**How to avoid**: Only release account access after payment is confirmed in your account, preferably through escrow.

### The Middleman Scam

**How it works**: Fake middlemen pose as marketplace staff to steal credentials from both parties.

**How to avoid**: Only use official marketplace support and verify staff credentials through official channels.

## Protecting Your Investment

### Regular Account Maintenance

- **Monitor Login Activity**: Check for unauthorized access attempts
- **Update Security Settings**: Regularly review and update passwords
- **Review Linked Accounts**: Ensure only authorized devices/accounts are linked
- **Keep Software Updated**: Update Epic Games launcher and gaming platform

### If Your Account is Compromised

Take immediate action:

1. **Change Your Password**: Use Epic Games' account recovery
2. **Enable 2FA**: If not already enabled
3. **Contact Epic Support**: Report unauthorized access
4. **Review Purchases**: Check for unauthorized V-Bucks spending
5. **Alert Your Payment Provider**: If financial information was compromised

## Marketplace Best Practices

### Choosing the Right Platform

Look for marketplaces that offer:

- **Escrow Services**: Payment held until transaction completes
- **Buyer/Seller Protection**: Policies protecting both parties
- **Verification Systems**: Seller verification for added trust
- **Dispute Resolution**: Fair process for handling conflicts
- **Secure Communications**: Private messaging systems

### Understanding Platform Fees

Factor in marketplace fees:

- Platform commission (typically 5-15%)
- Payment processing fees
- Withdrawal fees for sellers
- Premium feature costs

**Nashflare Example**: 5% platform fee with transparent breakdown before finalizing purchases.

## Legal and Terms of Service Considerations

### Epic Games Terms of Service

Be aware that:

- Account selling violates Epic Games TOS
- Epic may terminate accounts involved in sales
- No legal recourse through Epic for sales gone wrong
- Account ownership technically stays with Epic

### Risk Mitigation

While account selling involves TOS risks:

- Use reputable platforms with proven track records
- Maintain transaction documentation
- Understand you're accepting inherent risks
- Consider this when pricing accounts

## Advanced Security Tips

### Account Recovery Prevention

To prevent original owners from recovering accounts:

1. **Change All Security Questions**: Update to information only you know
2. **Update Email**: Change to an email you control
3. **Modify Payment Methods**: Remove old payment info, add your own
4. **Enable All Security Features**: Maximize Epic's security options

### Using VPNs and IP Management

Consider using VPNs to:

- Mask your location during sensitive transactions
- Protect against IP-based account recovery
- Add an extra layer of privacy

**Important**: Some VPNs may trigger Epic's security systems, so use reputable services.

## Conclusion

Fortnite account safety requires vigilance, whether you're buying, selling, or simply maintaining your account. By following these comprehensive guidelines, you can significantly reduce risks and protect your valuable digital assets.

Remember: if something feels wrong during a transaction, trust your instincts and walk away. Legitimate deals will proceed with proper verification and security measures.

## Quick Reference Checklist

**Before Buying:**
- ✅ Research marketplace reputation
- ✅ Verify account details and screenshots
- ✅ Check seller ratings and history
- ✅ Understand buyer protection policies
- ✅ Use secure payment methods

**After Purchase:**
- ✅ Change password immediately
- ✅ Enable 2FA
- ✅ Update email address
- ✅ Remove old payment methods
- ✅ Verify all items match listing

**For Sellers:**
- ✅ Document all account contents
- ✅ Remove personal information
- ✅ Use escrow services
- ✅ Communicate professionally
- ✅ Follow platform guidelines

Stay safe out there, and enjoy your Fortnite experience!
    `
  },
  'valorant-ranked-guide-climb-to-radiant': {
    slug: 'valorant-ranked-guide-climb-to-radiant',
    title: 'How to Climb to Radiant in Valorant: Pro Tips & Strategies',
    excerpt: 'Master the art of climbing the Valorant ranked ladder with proven strategies from professional players and high-ELO accounts.',
    category: 'Guides',
    game: 'Valorant',
    author: 'Nashflare Team',
    date: '2024-11-12',
    readTime: '12 min read',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&auto=format&fit=crop',
    tags: ['Valorant', 'Ranked', 'Gaming Tips'],
    content: `
# Introduction

Reaching Radiant rank in Valorant is the ultimate achievement for competitive players. This comprehensive guide will walk you through proven strategies, mindset techniques, and gameplay principles used by professional players to reach the highest rank in Valorant.

## Understanding the Ranked System

Before climbing, understand Valorant's competitive structure:

### Rank Tiers
- **Iron (1-3)**
- **Bronze (1-3)**
- **Silver (1-3)**
- **Gold (1-3)**
- **Platinum (1-3)**
- **Diamond (1-3)**
- **Ascendant (1-3)**
- **Immortal (1-3)**
- **Radiant** (Top 500 players per region)

### RR (Rank Rating) System

Your rank rating determines promotion and demotion:

- **Win**: +10 to +30 RR (performance-based)
- **Loss**: -10 to -30 RR (performance-based)
- **Draw**: Typically +/- 0 to +/- 5 RR

**Pro Tip**: Focus on consistent performance rather than just winning. MVP and combat scores heavily influence RR gains.

## Fundamental Skills to Master

### 1. Aim and Crosshair Placement

**Crosshair Positioning:**
- Keep crosshair at head level at all times
- Pre-aim common angles before peeking
- Adjust height based on elevation changes
- Clear angles systematically, not randomly

**Training Routine:**
- 15 minutes daily in Aim Lab or Kovaak's
- 10 minutes of deathmatches before ranked
- Focus on first bullet accuracy
- Practice counter-strafing in the Range

### 2. Game Sense and Map Awareness

**Key Components:**
- Minimap awareness (check every 3-5 seconds)
- Sound cue recognition (footsteps, abilities)
- Economy tracking (yours and enemy team)
- Rotation timing and positioning

**Developing Game Sense:**
- Watch professional VODs
- Analyze your own replays
- Learn common enemy positions
- Understand timing windows for rotations

### 3. Movement Mechanics

**Essential Techniques:**
- Counter-strafing for accurate shots
- Jiggle peeking to gather info
- Wide swings vs. shoulder peeks
- Jump spotting for safe info gathering

**Movement Fundamentals:**
- Walking vs. running appropriately
- Silent walk usage in clutches
- Bunny hopping for mobility (situation-dependent)
- Crouch spraying technique

## Agent Selection and Mastery

### Choosing Your Agent Pool

**Optimal Pool Size:**
- **Main Agent**: Your best, most comfortable pick
- **Secondary**: Alternative for when main is taken
- **Flex Pick**: Fill role to round out team composition

### Role Understanding

**Duelist:**
- Entry fragging responsibility
- Create space for team
- High fragging potential
- Best for aggressive players

**Initiator:**
- Information gathering
- Set up teammates for kills
- Flash assistance for entries
- Requires good communication

**Controller:**
- Smoke coverage for executes
- Block vision and control space
- Enable team strategies
- Requires map knowledge

**Sentinel:**
- Hold flanks and watch sites
- Delay enemy pushes
- Provide intel on enemy positions
- Requires patience and discipline

### Top Agents for Climbing

**Best Solo Queue Agents:**

1. **Jett**: High carry potential, escape ability
2. **Reyna**: Self-sufficient, snowball potential
3. **Omen**: Solo smoke capability, repositioning
4. **Killjoy**: Passive info gathering, delay tactics
5. **Raze**: Explosive damage, mobility, map control

## Communication and Team Play

### Effective Call-Outs

**Essential Info to Communicate:**
- Enemy locations (precise call-outs)
- Enemy health (damaged/low)
- Ability usage (smokes, flashes, ultimates)
- Spike location and plant spots
- Your intentions and plans

**Communication Best Practices:**
- Keep comms clear and concise
- Don't backseat game after dying
- Stay positive even when losing
- Use ping system effectively
- Acknowledge teammate calls

### Playing Around Your Team

**Team Synergy Tips:**
- Trade kills when teammates die
- Support your entry fraggers
- Don't bait teammates
- Coordinate utility usage
- Adapt playstyle to team composition

## Economy Management

### Buy Strategy

**Understanding Economy:**

**Full Buy Rounds:**
- Full armor + main weapon + abilities
- Team coordinates same buy
- Maximum firepower for important rounds

**Eco Rounds:**
- Save for full buy next round
- Light armor or pistol only
- Play for orbs and minimal losses

**Force Buy:**
- Buy when can't full buy
- Attempt to win crucial rounds
- Risk not affording next round

### When to Save vs. Force

**Save When:**
- Already down 0-2 or 0-3 in the round
- Guaranteed spike plant for loss bonus
- Team majority is saving

**Force Buy When:**
- Need to win to avoid 0-4 or similar
- Preventing enemy economy stack
- Match point situations

**Pro Tip**: Communicate buy intentions in buy phase. Going rogue on economy hurts the entire team.

## Map Knowledge and Positioning

### Essential Positions to Learn

**For Each Map Learn:**
- Default positions for your role
- Off-angle spots (used sparingly)
- Post-plant positions
- Retake positions and angles
- Safe planting spots

### Map-Specific Strategies

**Ascent:**
- Mid control is crucial
- B main has lots of angles
- Catwalk control for A site access

**Bind:**
- Teleporter plays and fakes
- No mid means A/B binary
- Hookah control important

**Haven:**
- Three-site map requires split focus
- Garage control for C site
- A Long info crucial

**Split:**
- Verticality plays a major role
- Mid control accesses both sites
- Ropes create unique plays

**Breeze:**
- Long-range engagements
- A Hall control is crucial
- B Tunnel stacking common

**Fracture:**
- Attacking from both sides
- Orb control is significant
- Rope plays for sneaky flanks

**Pearl:**
- Art gallery control for mid
- B Long has many angles
- A Main corridor important

**Lotus:**
- Rotating doors mechanic
- Three sites like Haven
- Verticality and breakable walls

## Mental Game and Consistency

### Developing a Champion's Mindset

**Key Mental Attributes:**

1. **Resilience**: Bounce back from losses quickly
2. **Self-Reflection**: Analyze mistakes objectively
3. **Patience**: Don't tilt or force plays
4. **Adaptability**: Adjust strategies mid-game
5. **Confidence**: Believe in your decisions

### Dealing with Toxicity

**Healthy Responses:**
- Mute toxic players immediately
- Don't engage in arguments
- Focus on your own gameplay
- Take breaks after frustrating games
- Remember it's just a game

### Avoiding Tilt

**Pre-Emptive Measures:**
- Never play more than 3 ranked games straight
- Take 5-10 minute breaks between games
- Stop playing after 2 consecutive losses
- Maintain healthy eating and sleep schedule
- Exercise before gaming sessions

## Advanced Strategies

### Trading Kills

Trading is essential at high ranks:

- Follow up your teammate's peek within 1-2 seconds
- Refrag their kill or avenge their death
- Maintain numerical advantage
- Never leave teammates isolated

### Utility Combos

**Powerful Combinations:**
- Sova Dart + Raze Nade
- Breach Stun + Jett Dash
- Omen Smoke + Reyna Dismiss
- KAY/O Knife + Team Push

### Playing Retake

**Retake Fundamentals:**
- Wait for team to group (usually)
- Use util to clear common spots
- Trade kills methodically
- Don't over-peek the defuser

### Clutch Situations

**1vX Guidelines:**
- Play time and positioning
- Force 1v1 gunfights
- Use sound to your advantage
- Stay calm and patient
- Spike advantage plays

## Training Routines for Improvement

### Daily Warm-Up (30 minutes)

**Routine Breakdown:**
1. **Range** (10 min): Bot elimination drills
2. **Deathmatch** (15 min): Real combat practice
3. **Aim Trainer** (5 min): Precision drills

### Weekly Review (1 hour)

**Self-Improvement Session:**
- Review 2-3 ranked games
- Identify 3 specific mistakes
- Note 3 things done well
- Set goals for improvement

### Agent Mastery Practice

**Per Agent You Play:**
- Learn all lineups on all maps
- Practice ability combos
- Understand optimal positioning
- Master unique mechanics

## Reaching Radiant: The Final Push

### Immortal to Radiant Requirements

**What It Takes:**
- Exceptional consistency
- Deep game knowledge
- Clutch potential
- Team adaptability
- Mental fortitude

### Time Investment

**Realistic Expectations:**
- 3-6 months from Diamond to Immortal
- 2-4 months from Immortal to Radiant
- 3-5 hours daily of focused play
- Additional time for VOD review

### When to Consider Buying a High-Rank Account

Some players choose to purchase high-ELO accounts to:

- **Learn from better players**: Play with/against Radiant players
- **Test their skills**: See if they belong at high ranks
- **Save time**: Skip the grind through lower ranks
- **Practice specific scenarios**: Experience high-level gameplay

**Important Considerations:**
- Accounts may derank without skill to maintain
- Understand this is against TOS
- Use reputable marketplaces like Nashflare
- Ensure account has proper verification

## Conclusion

Reaching Radiant requires dedication, skill, and the right mindset. Focus on consistent improvement rather than rank obsession. Every game is an opportunity to learn, whether you win or lose.

**Remember**: The journey to Radiant is about becoming a complete player. Master the fundamentals, develop game sense, communicate effectively, and maintain a positive mental attitude.

## Quick Reference for Ranking Up

**Daily Must-Dos:**
- ✅ Warm-up routine before ranked
- ✅ 3-5 focused ranked games
- ✅ Positive communication
- ✅ Watch one VOD or pro stream
- ✅ Take breaks between games

**Weekly Must-Dos:**
- ✅ Review your own gameplay
- ✅ Learn new agent lineups
- ✅ Play with a consistent group
- ✅ Rest day (no ranked)
- ✅ Update strategy notes

**Avoid:**
- ❌ Playing tilted or tired
- ❌ Solo queueing late at night
- ❌ Playing more than 5 games straight
- ❌ Instalocking without team comp consideration
- ❌ Blaming teammates for losses

Good luck on your climb to Radiant!
    `
  },
  // Add more blog posts with full content here...
}

const relatedPosts = [
  {
    slug: 'gaming-marketplace-safety-avoiding-scams',
    title: 'Gaming Marketplace Safety: How to Avoid Scams',
    category: 'Safety',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop'
  },
  {
    slug: 'best-gaming-accounts-to-buy-2024',
    title: 'Best Gaming Accounts to Buy in 2024',
    category: 'Reviews',
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&auto=format&fit=crop'
  },
  {
    slug: 'league-of-legends-smurf-accounts-explained',
    title: 'League of Legends Smurf Accounts: Everything You Need to Know',
    category: 'Education',
    image: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=400&auto=format&fit=crop'
  }
]

export default function BlogPostPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)

  const slug = params.slug as string
  const post = blogPosts[slug]

  useEffect(() => {
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-6xl mb-4">📄</div>
            <h1 className="text-3xl font-bold text-white mb-4">Article Not Found</h1>
            <Link href="/blog" className="text-purple-400 hover:text-purple-300">
              ← Back to Blog
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Performance-Optimized Cosmic Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950"></div>
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-[350px] h-[350px] bg-blue-600/15 rounded-full blur-[90px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f108_1px,transparent_1px),linear-gradient(to_bottom,#6366f108_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <div className="relative z-10">
        {/* Breadcrumb */}
        <div className="max-w-4xl mx-auto px-4 py-6 pt-8">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-white">{post.title}</span>
          </div>
        </div>

        {/* Hero Image */}
        <div className="max-w-6xl mx-auto px-4 mb-12">
          <div className="relative h-[400px] rounded-3xl overflow-hidden">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"></div>
          </div>
        </div>

        {/* Article Header */}
        <article className="max-w-4xl mx-auto px-4 mb-20">
          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <span className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-semibold">
              {post.category}
            </span>
            <span className="text-gray-400 text-sm">{post.date}</span>
            <span className="text-gray-400 text-sm">{post.readTime}</span>
            <span className="text-gray-400 text-sm">By {post.author}</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8 pb-8 border-b border-white/10">
            {post.tags.map((tag: string) => (
              <span
                key={tag}
                className="px-3 py-1 bg-slate-800/60 text-gray-400 text-sm rounded-lg"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Article Content */}
          <div className="prose prose-invert prose-lg max-w-none">
            <div className="text-gray-300 leading-relaxed space-y-6">
              {post.content.split('\n').map((paragraph: string, index: number) => {
                // Handle headings
                if (paragraph.startsWith('# ')) {
                  return <h1 key={index} className="text-4xl font-bold text-white mt-12 mb-6">{paragraph.replace('# ', '')}</h1>
                }
                if (paragraph.startsWith('## ')) {
                  return <h2 key={index} className="text-3xl font-bold text-white mt-10 mb-4">{paragraph.replace('## ', '')}</h2>
                }
                if (paragraph.startsWith('### ')) {
                  return <h3 key={index} className="text-2xl font-bold text-white mt-8 mb-3">{paragraph.replace('### ', '')}</h3>
                }
                
                // Handle bold text
                if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                  return <p key={index} className="font-semibold text-white mb-4">{paragraph.replace(/\*\*/g, '')}</p>
                }
                
                // Handle list items
                if (paragraph.startsWith('- ')) {
                  return <li key={index} className="ml-6 mb-2">{paragraph.replace('- ', '')}</li>
                }
                
                // Handle checkmarks
                if (paragraph.startsWith('- ✅')) {
                  return <li key={index} className="ml-6 mb-2 text-green-400">{paragraph.replace('- ', '')}</li>
                }
                if (paragraph.startsWith('- ❌')) {
                  return <li key={index} className="ml-6 mb-2 text-red-400">{paragraph.replace('- ', '')}</li>
                }
                
                // Regular paragraphs
                if (paragraph.trim()) {
                  return <p key={index} className="mb-4">{paragraph}</p>
                }
                
                return null
              })}
            </div>
          </div>

          {/* Author Box */}
          <div className="mt-16 p-8 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">N</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Nashflare Team</h3>
                <p className="text-gray-400">Gaming Marketplace Experts</p>
              </div>
            </div>
            <p className="text-gray-300">
              Our team of gaming industry professionals and marketplace experts brings you the latest insights, 
              guides, and tips for navigating the world of gaming accounts, items, and currency trading.
            </p>
          </div>

          {/* Share Buttons */}
          <div className="mt-12 flex items-center gap-4">
            <span className="text-gray-400 font-semibold">Share this article:</span>
            <button className="p-3 bg-slate-800/60 hover:bg-slate-700/60 border border-white/10 rounded-lg transition-colors">
              <span className="text-xl">🐦</span>
            </button>
            <button className="p-3 bg-slate-800/60 hover:bg-slate-700/60 border border-white/10 rounded-lg transition-colors">
              <span className="text-xl">📘</span>
            </button>
            <button className="p-3 bg-slate-800/60 hover:bg-slate-700/60 border border-white/10 rounded-lg transition-colors">
              <span className="text-xl">🔗</span>
            </button>
          </div>
        </article>

        {/* Related Articles */}
        <div className="max-w-6xl mx-auto px-4 mb-20">
          <h2 className="text-3xl font-bold text-white mb-8">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {relatedPosts.map((relatedPost) => (
              <Link
                key={relatedPost.slug}
                href={`/blog/${relatedPost.slug}`}
                className="group bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 hover:-translate-y-2 transition-all duration-500"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={relatedPost.image}
                    alt={relatedPost.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60"></div>
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-purple-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
                      {relatedPost.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                    {relatedPost.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto px-4 mb-20">
          <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center">
            <div className="text-5xl mb-6">🎮</div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Start Trading?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Join thousands of gamers buying and selling accounts, items, and currency on Nashflare's trusted marketplace
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/browse"
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
              >
                Browse Marketplace
              </Link>
              <Link
                href="/sell"
                className="px-8 py-4 bg-slate-800/60 border border-white/10 text-white rounded-xl font-semibold hover:bg-slate-700/60 transition-all duration-300"
              >
                Start Selling
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}