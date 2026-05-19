export default function PrivacyPolicy() {
  return (
    <div className="animate-fadeIn" style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <h1 className="page-title">Privacy Policy</h1>
      
      <div className="card mt-6">
        <div className="card-body">
          <p className="text-muted mb-4">Last updated: May 19, 2026</p>
          
          <h2 className="text-xl mb-3 mt-6" style={{ fontWeight: 600 }}>1. Introduction</h2>
          <p className="mb-4 text-sm" style={{ lineHeight: '1.6' }}>
            SocialPilot ("we", "our", or "us") respects your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our social media automation tool.
          </p>

          <h2 className="text-xl mb-3 mt-6" style={{ fontWeight: 600 }}>2. Information We Collect</h2>
          <p className="mb-4 text-sm" style={{ lineHeight: '1.6' }}>
            When you connect your Facebook or Instagram account, we receive OAuth access tokens. We use these tokens strictly to publish posts to your Pages on your behalf. We do not download, store, or process your personal profile data, friend lists, or private messages.
          </p>

          <h2 className="text-xl mb-3 mt-6" style={{ fontWeight: 600 }}>3. How We Use Your Information</h2>
          <p className="mb-4 text-sm" style={{ lineHeight: '1.6' }}>
            We use the access tokens exclusively to:
          </p>
          <ul className="list-disc pl-6 mb-4 text-sm" style={{ lineHeight: '1.6' }}>
            <li>Publish content you have approved to your connected social media pages.</li>
            <li>Fetch basic engagement statistics (likes, comments, impressions) for the posts we publish.</li>
          </ul>

          <h2 className="text-xl mb-3 mt-6" style={{ fontWeight: 600 }}>4. Data Retention and Deletion</h2>
          <p className="mb-4 text-sm" style={{ lineHeight: '1.6' }}>
            We retain your access tokens only as long as you use the service. You can revoke access at any time through your Facebook settings. For detailed instructions on data deletion, please visit our <a href="/data-deletion" style={{ color: 'var(--text-accent)' }}>Data Deletion Instructions</a> page.
          </p>

          <h2 className="text-xl mb-3 mt-6" style={{ fontWeight: 600 }}>5. Contact Us</h2>
          <p className="mb-4 text-sm" style={{ lineHeight: '1.6' }}>
            If you have questions about this Privacy Policy, please contact the administrator of this SocialPilot instance.
          </p>
        </div>
      </div>
    </div>
  );
}
