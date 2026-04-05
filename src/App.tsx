import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PlaylistProvider } from './context/PlaylistContext';
import Home         from './pages/Home';
import EditorView   from './pages/EditorView';
import ReceiverView from './pages/ReceiverView';
import NotFound     from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <PlaylistProvider>
        <Routes>
          <Route path="/"                element={<Home />} />
          <Route path="/edit/:sessionId" element={<EditorView />} />
          <Route path="/view/:sessionId" element={<ReceiverView />} />
          <Route path="*"                element={<NotFound />} />
        </Routes>
      </PlaylistProvider>
    </BrowserRouter>
  );
}
