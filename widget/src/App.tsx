import Chat from './Chat'

export default function App() {
    return (
        <div>
            <h1>Chat Widget Test</h1>
            <Chat
                config={{
                    clientId: 'client_4c4232effea6',
                    welcome_message: 'Hello from Vite!'
                }}
                onConfigUpdate={() => { }}
            />
        </div>
    )
}