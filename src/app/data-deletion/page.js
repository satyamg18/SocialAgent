export default function DataDeletion() {
  return (
    <div className="animate-fadeIn" style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <h1 className="page-title">User Data Deletion Instructions</h1>
      
      <div className="card mt-6">
        <div className="card-body">
          <p className="text-muted mb-6">
            SocialPilot is a social media management tool that connects to your Facebook and Instagram accounts. We do not store personal profiles, but we do store page access tokens to publish on your behalf.
          </p>
          
          <h2 className="text-xl mb-4" style={{ fontWeight: 600 }}>How to revoke access and delete your data:</h2>
          
          <ol className="list-decimal pl-6 mb-6" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li>Go to your Facebook account's <strong>Settings & Privacy</strong> menu.</li>
            <li>Click on <strong>Settings</strong>.</li>
            <li>Look for <strong>Business Integrations</strong> or <strong>Apps and Websites</strong> in the left sidebar menu.</li>
            <li>Find the <strong>SocialPilot</strong> app in the list of active integrations.</li>
            <li>Click <strong>Remove</strong> next to SocialPilot.</li>
            <li>Check the box to delete all posts, photos and videos on Facebook that SocialPilot may have published on your behalf (optional).</li>
            <li>Click <strong>Remove</strong> to confirm.</li>
          </ol>
          
          <div className="p-4" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <p className="text-sm">
              <strong>Note:</strong> Once you remove the app integration from your Facebook settings, our system will immediately lose access to your page. Any access tokens stored in our database will be permanently invalidated and automatically purged during routine cleanup. 
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
