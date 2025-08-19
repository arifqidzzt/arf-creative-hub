import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Ahmad Rizki",
      role: "Gamer Professional",
      content: "Top-up game di ArfCoder sangat cepat dan aman. Sudah berlangganan bot premium juga, kualitasnya luar biasa!",
      rating: 5,
      avatar: "AR"
    },
    {
      name: "Sinta Dewi", 
      role: "Content Creator",
      content: "Fitur cerpen dan komik di ArfCoder sangat membantu saya berbagi karya. Admin juga responsif dalam review.",
      rating: 5,
      avatar: "SD"
    },
    {
      name: "Budi Santoso",
      role: "Business Owner", 
      content: "WhatsApp bot dari ArfCoder membantu otomatisasi bisnis saya. ROI yang sangat menguntungkan!",
      rating: 5,
      avatar: "BS"
    },
    {
      name: "Maya Putri",
      role: "Mobile Legends Player",
      content: "Diamond ML selalu masuk langsung, harga juga lebih murah dari platform lain. Recommended!",
      rating: 5,
      avatar: "MP"
    },
    {
      name: "Doni Prakasa",
      role: "Entrepreneur",
      content: "Telegram bot business benar-benar game changer untuk customer service kami. Highly recommended!",
      rating: 5,
      avatar: "DP"
    },
    {
      name: "Lina Sari",
      role: "Writer",
      content: "Platform yang bagus untuk penulis pemula. Proses submit cerpen mudah dan feedback constructive.",
      rating: 5,
      avatar: "LS"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Apa Kata Mereka?
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ribuan pengguna telah mempercayai ArfCoder untuk kebutuhan digital mereka
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-semibold mr-4">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-3">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <div className="relative">
                    <Quote className="h-6 w-6 text-muted-foreground/30 absolute -top-1 -left-1" />
                    <p className="text-muted-foreground pl-5">{testimonial.content}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;