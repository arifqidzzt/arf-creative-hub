import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { BookOpen, Plus, Eye, Heart, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Stories = () => {
  const stories = [
    {
      id: 1,
      title: "Perjalanan ke Masa Depan",
      author: "Admin ArfCoder",
      type: "Cerpen",
      excerpt: "Sebuah cerita tentang seorang programmer yang menemukan cara untuk melakukan perjalanan waktu melalui kode...",
      views: 1250,
      likes: 89,
      comments: 23,
      publishedAt: "2 hari yang lalu",
      category: "Sci-Fi"
    },
    {
      id: 2,
      title: "Petualangan Digital",
      author: "Admin ArfCoder",
      type: "Komik",
      excerpt: "Komik tentang dunia digital dimana setiap karakter memiliki kekuatan coding yang unik...",
      views: 2100,
      likes: 156,
      comments: 45,
      publishedAt: "1 minggu yang lalu",
      category: "Adventure"
    },
    {
      id: 3,
      title: "Rahasia Bot AI",
      author: "Admin ArfCoder", 
      type: "Cerpen",
      excerpt: "Kisah tentang seorang developer yang menciptakan AI bot yang mulai memiliki kesadaran sendiri...",
      views: 890,
      likes: 67,
      comments: 12,
      publishedAt: "3 hari yang lalu",
      category: "Mystery"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Cerpen & Komik
            </span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Baca cerita menarik atau ajukan permintaan untuk menjadi penulis
          </p>
          
          <Button 
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            onClick={() => {
              // TODO: Open story submission form
              console.log("Ajukan permintaan menulis clicked");
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajukan Permintaan Menulis
          </Button>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 mb-8"
        >
          {['Semua', 'Cerpen', 'Komik', 'Terpopuler', 'Terbaru'].map((filter) => (
            <Button
              key={filter}
              variant={filter === 'Semua' ? 'default' : 'outline'}
              className={filter === 'Semua' ? 'bg-gradient-to-r from-primary to-secondary' : ''}
              onClick={() => {
                // TODO: Implement filter functionality
                console.log(`Filter ${filter} clicked`);
              }}
            >
              {filter}
            </Button>
          ))}
        </motion.div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300 group cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {story.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {story.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {story.title}
                  </CardTitle>
                  <CardDescription>
                    oleh {story.author}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {story.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>{story.views}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="h-3 w-3" />
                        <span>{story.likes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{story.comments}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{story.publishedAt}</span>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    onClick={() => {
                      // TODO: Open story reader
                      console.log(`Read story ${story.id} clicked`);
                    }}
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Baca Cerita
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Request Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="max-w-2xl mx-auto bg-card/50 backdrop-blur-sm border rounded-xl p-8">
            <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Ingin Menjadi Penulis?</h3>
            <p className="text-muted-foreground mb-6">
              Ajukan permintaan untuk menjadi kontributor cerita di platform kami. 
              Admin akan meninjau aplikasi Anda dan memberikan akses menulis jika disetujui.
            </p>
            <Button 
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              onClick={() => {
                // TODO: Open writer application form
                console.log("Ajukan sekarang clicked");
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajukan Sekarang
            </Button>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Stories;