import { useEventHistory, EventHistoryItem } from "../hooks/useEventHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Edit2, X, Users } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import Header from '../components/Header';
import MobileFooterNav from '../components/MobileFooterNav';

const MyEvents = () => {
  const { history, createdEvents, loading, editEvent } = useEventHistory();
  const [editingEvent, setEditingEvent] = useState<EventHistoryItem | null>(null);
  const toast = useToast();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Calculate counts for each tab
  const allCount = history.length;
  const activeCount = history.filter(event => 
    event.match_status === 'matched' || event.match_status === 'waiting'
  ).length;
  const completedCount = history.filter(event => 
    event.match_status === 'completed'
  ).length;
  const createdCount = createdEvents.length;

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      await editEvent(editingEvent.id, {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        category: formData.get('category') as string,
        start_time: formData.get('start_time') as string,
        end_time: formData.get('end_time') as string,
      });
      setEditingEvent(null);
    } catch (error) {
      // Show specific error message
      toast.showError(error instanceof Error ? error.message : 'Failed to update event');
    }
  };

  const renderEventCard = (event: EventHistoryItem) => {
    // Add validation before showing edit button
    const canEdit = event.is_editable && new Date(event.start_time) > new Date();
    
    return (
      <div key={event.id} className="bg-[#242538] rounded-xl p-4 hover:bg-[#2A2C42] transition-colors">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">{event.title}</h3>
          <div className="flex items-center gap-2">
            {event.participant_count !== undefined && (
              <div className="flex items-center gap-1 text-white/60">
                <Users className="w-4 h-4" />
                <span className="text-sm">{event.participant_count}</span>
              </div>
            )}
            {canEdit && (
              <button
                onClick={() => setEditingEvent(event)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Edit event"
              >
                <Edit2 className="w-4 h-4 text-[#CCFF00]" />
              </button>
            )}
          </div>
        </div>
        
        <p className="text-gray-400 text-sm mb-2">{event.description}</p>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            {new Date(event.start_time).toLocaleDateString()}
          </span>
          <span className={`px-2 py-1 rounded ${
            event.match_status === 'matched' ? 'bg-green-500/20 text-green-400' :
            event.match_status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' :
            event.match_status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {event.match_status.charAt(0).toUpperCase() + event.match_status.slice(1)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#1a1b2e]">
      <Header />
      
      <div className="container mx-auto p-4 pb-[72px]">
        <h1 className="text-2xl font-bold text-white mb-4">My Events</h1>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="flex border-b border-white/10">
            <TabsTrigger 
              value="all"
              className="flex-1 px-4 py-3 flex items-center justify-center gap-2 font-medium transition-colors"
            >
              All Events
              <span className="bg-[#242538] text-white/60 text-sm px-2 py-0.5 rounded-full">
                {allCount}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="active"
              className="flex-1 px-4 py-3 flex items-center justify-center gap-2 font-medium transition-colors"
            >
              Active
              <span className="bg-[#242538] text-white/60 text-sm px-2 py-0.5 rounded-full">
                {activeCount}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="completed"
              className="flex-1 px-4 py-3 flex items-center justify-center gap-2 font-medium transition-colors"
            >
              Completed
              <span className="bg-[#242538] text-white/60 text-sm px-2 py-0.5 rounded-full">
                {completedCount}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="created"
              className="flex-1 px-4 py-3 flex items-center justify-center gap-2 font-medium transition-colors"
            >
              Created
              <span className="bg-[#242538] text-white/60 text-sm px-2 py-0.5 rounded-full">
                {createdCount}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map(renderEventCard)}
            </div>
          </TabsContent>

          <TabsContent value="active">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history
                .filter(event => event.match_status === 'matched' || event.match_status === 'waiting')
                .map(renderEventCard)}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history
                .filter(event => event.match_status === 'completed')
                .map(renderEventCard)}
            </div>
          </TabsContent>

          <TabsContent value="created">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {createdEvents.map(renderEventCard)}
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Modal */}
        {editingEvent && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-[#242538] rounded-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Edit Event</h2>
                <button
                  onClick={() => setEditingEvent(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Title</label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={editingEvent.title}
                      className="w-full bg-[#1A1B2E] text-white rounded-lg px-4 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Description</label>
                    <textarea
                      name="description"
                      defaultValue={editingEvent.description}
                      className="w-full bg-[#1A1B2E] text-white rounded-lg px-4 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Category</label>
                    <input
                      type="text"
                      name="category"
                      defaultValue={editingEvent.category}
                      className="w-full bg-[#1A1B2E] text-white rounded-lg px-4 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Start Time</label>
                    <input
                      type="datetime-local"
                      name="start_time"
                      defaultValue={editingEvent.start_time}
                      className="w-full bg-[#1A1B2E] text-white rounded-lg px-4 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-1">End Time</label>
                    <input
                      type="datetime-local"
                      name="end_time"
                      defaultValue={editingEvent.end_time}
                      className="w-full bg-[#1A1B2E] text-white rounded-lg px-4 py-2"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingEvent(null)}
                    className="px-4 py-2 text-white/60 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#CCFF00] text-black rounded-lg hover:bg-[#B8E600] transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <MobileFooterNav />
    </div>
  );
};

export default MyEvents;
