export default function BotSetupPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Telegram Bot Setup Guide</h1>
          <p className="text-lg text-gray-600">
            Set up your QuickCart bot in just 5 minutes. No coding required!
          </p>
        </div>

        {/* Steps Container */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
          
          {/* Step 1 */}
          <div className="mb-8">
            <div className="flex items-center mb-3">
              <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">1</span>
              <h2 className="text-xl font-bold text-gray-900">Open BotFather</h2>
            </div>
            <p className="text-gray-600 ml-11 mb-3">
              Open the Telegram app and search for <code className="bg-gray-100 px-2 py-1 rounded text-blue-600 font-mono">@BotFather</code> in the search bar.
            </p>
            <p className="text-gray-600 ml-11">
              Click on the official BotFather account (with the blue tick) and tap the <strong>Start</strong> button.
            </p>
          </div>

          <hr className="border-gray-100 my-6" />

          {/* Step 2 */}
          <div className="mb-8">
            <div className="flex items-center mb-3">
              <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">2</span>
              <h2 className="text-xl font-bold text-gray-900">Create a New Bot</h2>
            </div>
            <p className="text-gray-600 ml-11 mb-3">
              Type and send the following command in the chat box:
            </p>
            <div className="ml-11 bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-lg inline-block">
              /newbot
            </div>
          </div>

          <hr className="border-gray-100 my-6" />

          {/* Step 3 */}
          <div className="mb-8">            <div className="flex items-center mb-3">
              <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">3</span>
              <h2 className="text-xl font-bold text-gray-900">Name Your Bot</h2>
            </div>
            <p className="text-gray-600 ml-11">
              BotFather will ask for a name for your bot. You can give it any name, for example: <br/>
              <code className="bg-gray-100 px-2 py-1 rounded text-gray-800 font-mono">Rahul General Store Bot</code>
            </p>
          </div>

          <hr className="border-gray-100 my-6" />

          {/* Step 4 */}
          <div className="mb-8">
            <div className="flex items-center mb-3">
              <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">4</span>
              <h2 className="text-xl font-bold text-gray-900">Set a Username</h2>
            </div>
            <p className="text-gray-600 ml-11 mb-3">
              Now, you need a unique username. Please note, the username must end with <strong>'bot'</strong>. <br/>
              Example: <code className="bg-gray-100 px-2 py-1 rounded text-gray-800 font-mono">rahul_store_quickbot</code>
            </p>
          </div>

          <hr className="border-gray-100 my-6" />

          {/* Step 5 */}
          <div className="mb-4">
            <div className="flex items-center mb-3">
              <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">5</span>
              <h2 className="text-xl font-bold text-gray-900">Copy Your API Token</h2>
            </div>
            <p className="text-gray-600 ml-11 mb-3">
              BotFather will send you a long message. Inside it, you will find an <strong>HTTP API Token</strong> that looks something like this:
            </p>
            <div className="ml-11 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <p className="font-mono text-sm text-gray-800 break-all">
                123456789:ABCdefGhIjKlMnOpQrStUvWxYz123456789
              </p>
            </div>
            <p className="text-gray-600 ml-11 mt-3 font-semibold text-blue-700">
              👉 Please copy this token!
            </p>
          </div>
        </div>

        {/* Support / Help Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 text-center">
          <div className="text-4xl mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Stuck Somewhere?</h2>          <p className="text-gray-600 mb-6 max-w-lg mx-auto">
            No worries! Our team is ready to help you. Just send your Bot Token to our support email, and we will set up the bot for you.
          </p>
          
          <a 
            href="mailto:supportquickcart0gmail.com?subject=Need%20Help%20with%20Bot%20Setup&body=Hi%20QuickCart%20Team,%0A%0AI%20am%20stuck%20setting%20up%20my%20bot.%20Here%20is%20my%20Bot%20Token:%0A%0A%5BPASTE%20YOUR%20TOKEN%20HERE%5D%0A%0AMy%20Shop%20Name:%20%0AMy%20Phone%20Number:%20"
            className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
          >
             Email Support Team
          </a>
          
          <p className="text-sm text-gray-500 mt-4">
            We reply within 24 hours.
          </p>
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <a href="/landing" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to Home
          </a>
        </div>

      </div>
    </div>
  );
}
