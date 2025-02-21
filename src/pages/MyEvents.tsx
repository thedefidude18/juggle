import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const MyEvents = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          {/* Upcoming events content */}
        </TabsContent>
        <TabsContent value="past">
          {/* Past events content */}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyEvents;
