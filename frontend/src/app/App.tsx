import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { CartProvider } from '../contexts/CartContext'
import { SiteLayout } from '../layouts/SiteLayout'
import { PrivateRoute } from '../shared/components/PrivateRoute'
import { AdminAnalyticsPage } from '../features/pages/AdminAnalyticsPage'
import { AdminCommentsPage } from '../features/pages/AdminCommentsPage'
import { AdminDashboardPage } from '../features/pages/AdminDashboardPage'
import { AdminModerationPage } from '../features/pages/AdminModerationPage'
import { AdminPostsPage } from '../features/pages/AdminPostsPage'
import { AdminUsersPage } from '../features/pages/AdminUsersPage'
import { CartPage } from '../features/pages/CartPage'
import { CheckoutPage } from '../features/pages/CheckoutPage'
import { CommunityPage } from '../features/pages/CommunityPage'
import { CommunityPostPage } from '../features/pages/CommunityPostPage'
import { ComparisonPage } from '../features/pages/ComparisonPage'
import { CreatePostPage } from '../features/pages/CreatePostPage'
import { FavoritesPage } from '../features/pages/FavoritesPage'
import { ForgotPasswordPage } from '../features/pages/ForgotPasswordPage'
import { HomePage } from '../features/pages/HomePage'
import { LoginPage } from '../features/pages/LoginPage'
import { MatchDetailPage } from '../features/pages/MatchDetailPage'
import { LoLEsportsDetailPage } from '../features/pages/LoLEsportsDetailPage'
import { MatchesPage } from '../features/pages/MatchesPage'
import { MyCommentsPage } from '../features/pages/MyCommentsPage'
import { MyPostsPage } from '../features/pages/MyPostsPage'
import { NewsDetailPage } from '../features/pages/NewsDetailPage'
import { NewsPage } from '../features/pages/NewsPage'
import { NotFoundPage } from '../features/pages/NotFoundPage'
import { NotificationsPage } from '../features/pages/NotificationsPage'
import { OrderSuccessPage } from '../features/pages/OrderSuccessPage'
import { OrdersPage } from '../features/pages/OrdersPage'
import { PlayerDetailPage } from '../features/pages/PlayerDetailPage'
import { PlayersPage } from '../features/pages/PlayersPage'
import { ProductDetailPage } from '../features/pages/ProductDetailPage'
import { ProfilePage } from '../features/pages/ProfilePage'
import { RegisterPage } from '../features/pages/RegisterPage'
import { SearchPage } from '../features/pages/SearchPage'
import { SettingsPage } from '../features/pages/SettingsPage'
import { StorePage } from '../features/pages/StorePage'
import { TeamDetailPage } from '../features/pages/TeamDetailPage'
import { TeamsPage } from '../features/pages/TeamsPage'
import { TournamentDetailPage } from '../features/pages/TournamentDetailPage'
import { TournamentsPage } from '../features/pages/TournamentsPage'
import { TrendingPage } from '../features/pages/TrendingPage'
import { GridSeriesPage } from '../features/pages/GridSeriesPage'
import { GridSeriesDetailPage } from '../features/pages/GridSeriesDetailPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<SiteLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/news" element={<NewsPage />} />
                <Route path="/news/:id" element={<NewsDetailPage />} />
                <Route path="/news/detail" element={<NewsDetailPage />} />
                <Route path="/matches" element={<MatchesPage />} />
                <Route path="/matches/:id" element={<MatchDetailPage />} />
                <Route path="/lol-esports/:id" element={<LoLEsportsDetailPage />} />
                <Route path="/grid" element={<GridSeriesPage />} />
                <Route path="/grid/:id" element={<GridSeriesDetailPage />} />
                <Route path="/matches/detail" element={<MatchDetailPage />} />
                <Route path="/teams" element={<TeamsPage />} />
                <Route path="/teams/detail" element={<TeamDetailPage />} />
                <Route path="/players" element={<PlayersPage />} />
                <Route path="/players/detail" element={<PlayerDetailPage />} />
                <Route path="/comparison" element={<ComparisonPage />} />
                <Route path="/tournaments" element={<TournamentsPage />} />
                <Route path="/tournaments/detail" element={<TournamentDetailPage />} />
                <Route path="/community" element={<CommunityPage />} />
                <Route path="/community/post" element={<CommunityPostPage />} />
                <Route path="/community/:id" element={<CommunityPostPage />} />
                <Route path="/community/create" element={<PrivateRoute><CreatePostPage /></PrivateRoute>} />
                <Route path="/store" element={<StorePage />} />
                <Route path="/store/:id" element={<ProductDetailPage />} />
                <Route path="/store/detail" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
                <Route path="/order/success" element={<OrderSuccessPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/trending" element={<TrendingPage />} />
                <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/register" element={<RegisterPage />} />
                <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
                <Route path="/profile/posts" element={<PrivateRoute><MyPostsPage /></PrivateRoute>} />
                <Route path="/profile/comments" element={<PrivateRoute><MyCommentsPage /></PrivateRoute>} />
                <Route path="/profile/favorites" element={<PrivateRoute><FavoritesPage /></PrivateRoute>} />
                <Route path="/profile/orders" element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
                <Route path="/profile/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
                <Route path="/orders" element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/dashboard" element={<PrivateRoute><AdminDashboardPage /></PrivateRoute>} />
                <Route path="/admin/users" element={<PrivateRoute><AdminUsersPage /></PrivateRoute>} />
                <Route path="/admin/posts" element={<PrivateRoute><AdminPostsPage /></PrivateRoute>} />
                <Route path="/admin/comments" element={<PrivateRoute><AdminCommentsPage /></PrivateRoute>} />
                <Route path="/admin/moderation" element={<PrivateRoute><AdminModerationPage /></PrivateRoute>} />
                <Route path="/admin/analytics" element={<PrivateRoute><AdminAnalyticsPage /></PrivateRoute>} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
