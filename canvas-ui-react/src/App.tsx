import { Box, Chip, Container, Stack, Typography } from '@mui/material'
import './App.css'
import { MetadataInspector } from './components/MetadataInspector'

function App() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Canvas UI - React Migration
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Phase 1: Metadata-Driven Inspector
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Chip label="React 18.3.1" color="primary" size="small" />
          <Chip label="TypeScript 5.7.2" color="primary" size="small" />
          <Chip label="Vite 7.3.1" color="primary" size="small" />
          <Chip label="Material-UI 6.3.0" color="primary" size="small" />
          <Chip label="Zustand 4.5.0" color="secondary" size="small" />
          <Chip label="Dynamic Rendering" color="success" size="small" />
        </Box>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h6">Metadata Inspector</Typography>
            <Typography variant="body2" color="text.secondary">
              Reads widget manifest (Phase 1)
            </Typography>
          </Box>
          <MetadataInspector />
        </Box>
        
        <Box sx={{ flex: 1 }}>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h6">Hardcoded Inspector (Legacy)</Typography>
            <Typography variant="body2" color="text.secondary">
              Old manual sections - needs refactoring
            </Typography>
          </Box>
          {/* <ProductionInspector /> */}
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            (Temporarily disabled - use MetadataInspector instead)
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.100', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Phase 1 Complete - Feature Parity Achieved
        </Typography>
        <Typography variant="body2" paragraph>
          ✅ Dynamic field rendering from widget metadata<br />
          ✅ All critical field types: Text, Number, Checkbox, Select, Color, Entity, Slider, Icon, Dimension<br />
          ✅ Conditional field visibility (showIf)<br />
          ✅ Category grouping with accordions<br />
          ✅ Type-safe with TypeScript + Zustand<br />
          ✅ Material-UI design system
        </Typography>
        <Typography variant="body2">
          <strong>Next:</strong> Update bridge to send widget metadata, integrate into main canvas
        </Typography>
      </Box>
    </Container>
  )
}

export default App
