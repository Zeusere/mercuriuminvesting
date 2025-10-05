# Contributing to WhiteApp

Thank you for your interest in contributing to WhiteApp! This document provides guidelines for contributing to this project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/whiteapp.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Commit your changes: `git commit -m "Add your feature"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Open a Pull Request

## Development Guidelines

### Code Style

- Use TypeScript for all new files
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Component Guidelines

- Use functional components with hooks
- Keep components in the `components/` directory
- Use TypeScript interfaces for props
- Make components reusable when possible

### Commit Messages

Use clear and descriptive commit messages:

- `feat: Add new feature`
- `fix: Fix bug in authentication`
- `docs: Update README`
- `style: Format code`
- `refactor: Refactor user service`
- `test: Add tests for login`

### Testing

Before submitting a PR:

- [ ] Test all authentication flows
- [ ] Test in both light and dark mode
- [ ] Test on mobile devices
- [ ] Check for console errors
- [ ] Run `npm run lint`
- [ ] Run `npm run type-check`

## Areas for Contribution

### High Priority

- [ ] Unit tests
- [ ] E2E tests
- [ ] Accessibility improvements
- [ ] Performance optimizations
- [ ] Documentation improvements

### Features

- [ ] Email templates
- [ ] Password reset flow
- [ ] User profile editing
- [ ] Admin dashboard
- [ ] Payment integration
- [ ] More AI integrations

### Bug Fixes

Check the Issues page for known bugs.

## Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the SETUP.md if you change configuration steps
3. Ensure your code follows the existing style
4. Make sure all tests pass
5. Request review from maintainers

## Questions?

Feel free to open an issue for any questions or discussions!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

