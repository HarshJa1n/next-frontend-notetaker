import type { Metadata } from 'next'
import ThemeRegistry from '@/components/ThemeRegistry'
import Sidebar from '@/components/Sidebar'
import { AppBar, Box, Toolbar, Typography, Container } from '@mui/material'

export const metadata: Metadata = {
  title: 'Meet-sense',
  description: 'Meeting transcription and analysis tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <Box sx={{ display: 'flex' }}>
            <AppBar position="fixed" sx={{ zIndex: 2000 }}>
              <Toolbar>
                <Typography variant="h6" noWrap component="div">
                  Meet-sense
                </Typography>
              </Toolbar>
            </AppBar>
            <Sidebar />
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                bgcolor: 'background.default',
                p: 3,
                minHeight: '100vh',
                mt: 8,
              }}
            >
              <Container maxWidth="lg">
                {children}
              </Container>
            </Box>
          </Box>
        </ThemeRegistry>
      </body>
    </html>
  )
}
