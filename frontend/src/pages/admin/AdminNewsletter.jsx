import { useEffect, useState } from 'react';
import { Mail, Users, Download, Trash2, TrendingUp } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';

export default function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const [subsRes, statsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/newsletter/subscribers`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/newsletter/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setSubscribers(subsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to fetch newsletter data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const exportCSV = () => {
    if (subscribers.length === 0) {
      toast.error('No subscribers to export');
      return;
    }

    const headers = ['Email', 'Name', 'Subscribed At'];
    const csvContent = [
      headers.join(','),
      ...subscribers.map(s => [
        s.email,
        s.name || '',
        s.subscribed_at || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Exported successfully');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold text-white uppercase">Newsletter</h1>
          <Button 
            onClick={exportCSV}
            variant="outline" 
            className="border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-black"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Total Subscribers</p>
                  <p className="text-white font-bold text-xl">{stats?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Mail className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Active</p>
                  <p className="text-white font-bold text-xl">{stats?.active || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Trash2 className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Unsubscribed</p>
                  <p className="text-white font-bold text-xl">{stats?.unsubscribed || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">This Week</p>
                  <p className="text-white font-bold text-xl">{stats?.recent_week || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscribers Table */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">All Subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : subscribers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No subscribers yet</p>
                <p className="text-sm mt-1">Share your website to get newsletter signups!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-700">
                      <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Email</th>
                      <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Name</th>
                      <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Subscribed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((subscriber) => (
                      <tr key={subscriber.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                        <td className="py-3 px-4 text-white">{subscriber.email}</td>
                        <td className="py-3 px-4 text-gray-400">{subscriber.name || '-'}</td>
                        <td className="py-3 px-4 text-gray-400 text-sm">
                          {subscriber.subscribed_at ? new Date(subscriber.subscribed_at).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
