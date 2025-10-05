import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Founder & CEO',
    company: 'TechStart Inc.',
    content: 'This skeleton saved us months of development time. We went from idea to MVP in just 2 weeks!',
    rating: 5,
    avatar: '👩‍💼',
  },
  {
    name: 'Michael Chen',
    role: 'Lead Developer',
    company: 'DevStudio',
    content: 'Clean code, great documentation, and excellent support. Everything a developer needs.',
    rating: 5,
    avatar: '👨‍💻',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Product Manager',
    company: 'InnovateCo',
    content: 'The AI integration made it incredibly easy to add smart features to our product.',
    rating: 5,
    avatar: '👩‍🚀',
  },
]

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 px-4 bg-gray-50 dark:bg-gray-800/50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">
            Loved by Developers
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            See what our users have to say about WhiteApp
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="card">
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="text-yellow-400 fill-current"
                    size={20}
                  />
                ))}
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                &quot;{testimonial.content}&quot;
              </p>

              <div className="flex items-center">
                <div className="text-4xl mr-4">{testimonial.avatar}</div>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {testimonial.role}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

