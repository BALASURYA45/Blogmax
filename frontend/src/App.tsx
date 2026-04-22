import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PostDetail from './pages/PostDetail';
import CreatePost from './pages/CreatePost';
import EditPost from './pages/EditPost';
import Profile from './pages/Profile';
import About from './pages/About';
import Careers from './pages/Careers';
import Privacy from './pages/Privacy';
import Contact from './pages/Contact';
import LatestStories from './pages/LatestStories';
import Featured from './pages/Featured';
import Categories from './pages/Categories';
import Authors from './pages/Authors';
import Search from './pages/Search';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-grow app-main">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/post/:slug" element={<PostDetail />} />
                  <Route path="/profile/:id" element={<Profile />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/careers" element={<Careers />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/latest" element={<LatestStories />} />
                  <Route path="/featured" element={<Featured />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/authors" element={<Authors />} />
                  <Route path="/search" element={<Search />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/create" element={<CreatePost />} />
                    <Route path="/edit/:slug" element={<EditPost />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
