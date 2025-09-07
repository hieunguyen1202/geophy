import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Chip,
  Container,
  Button,
  Box,
  CircularProgress,
  Fade,
  Breadcrumbs,
  Link,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Paper,
  Divider
} from '@mui/material';
import { ArrowBack, Home as HomeIcon, FilterList } from '@mui/icons-material';
import NavigationBar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import type { BaseListMenu } from '../types';
import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/700.css';
import { useNavigate } from 'react-router-dom';
import { UNITY_PHY_URL } from '../api/apiConfig';


const simulations = [
  { id: "Acceleration", title: "Gia tốc", description: "Mô phỏng chuyển động có gia tốc, nghiên cứu mối quan hệ giữa lực, khối lượng và gia tốc theo định luật Newton II.", category: "Động lực học", icon: "🏃‍♂️", color: "#e3f2fd" },
  { id: "ChangeMachanicalEnergy", title: "Biến đổi năng lượng cơ học", description: "Khám phá sự chuyển đổi giữa động năng và thế năng trong các hệ cơ học khác nhau.", category: "Năng lượng", icon: "⚡", color: "#fff3e0" },
  { id: "CircularMotion", title: "Chuyển động tròn", description: "Mô phỏng chuyển động tròn đều và không đều, nghiên cứu lực hướng tâm và gia tốc hướng tâm.", category: "Động học", icon: "🌀", color: "#f3e5f5" },
  { id: "ElectricForce", title: "Lực điện", description: "Trực quan hóa lực tương tác giữa các điện tích và nghiên cứu định luật Coulomb.", category: "Điện học", icon: "⚡", color: "#e8f5e8" },
  { id: "FreeFall", title: "Rơi tự do", description: "Mô phỏng chuyển động rơi tự do của vật trong trường trọng lực, nghiên cứu gia tốc trọng trường.", category: "Cơ học", icon: "📉", color: "#ffebee" },
  { id: "ProjectileMotion", title: "Chuyển động ném xiên", description: "Mô phỏng quỹ đạo của vật được ném xiên trong trường trọng lực, với các yếu tố như vận tốc ban đầu và góc ném.", category: "Động học", icon: "🏹", color: "#fff8e1" }
];

const categories = ["Động lực học", "Năng lượng", "Động học", "Điện học", "Cơ học"];

interface UnitySimulationsProps {
  listMenuUser: BaseListMenu[];
}

const UnitySimulations: React.FC<UnitySimulationsProps> = ({ listMenuUser }) => {
  const [selectedSimulation, setSelectedSimulation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const navigate = useNavigate();

  const loadSimulation = (toolName: string) => {
    setSelectedSimulation(toolName);
    setLoading(true);
  };

  const handleIframeLoad = () => setLoading(false);

  const handleBack = () => setSelectedSimulation(null);

  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      "Động lực học": "primary",
      "Năng lượng": "warning",
      "Động học": "secondary",
      "Điện học": "success",
      "Cơ học": "error"
    };
    return colors[category] || "default";
  };

  const filteredSimulations = selectedCategories.length
    ? simulations.filter(sim => selectedCategories.includes(sim.category))
    : simulations;

  const selectedSimData = simulations.find(sim => sim.id === selectedSimulation);

  const getCategoryCount = (category: string) => {
    return simulations.filter(sim => sim.category === category).length;
  };

  return (
    <>
      <NavigationBar listMenuUser={listMenuUser} />
      <Container maxWidth="xl" sx={{ py: 4, minHeight: 'calc(100vh - 160px)' }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          align="center"
          sx={{
            fontFamily: '"Be Vietnam Pro", sans-serif',
            fontWeight: 'bold',
            mb: 4,
            background: 'linear-gradient(45deg, #f37021 30%, rgb(232, 120, 51) 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Mô Phỏng Trực Quan Qua Unity
        </Typography>

        {!selectedSimulation && (
          <Fade in={!selectedSimulation} timeout={500}>
            <Box sx={{ display: 'flex', gap: 3 }}>
              {/* Sidebar Filter */}
              <Paper
                elevation={2}
                sx={{
                  width: 280,
                  flexShrink: 0,
                  p: 3,
                  borderRadius: 3,
                  height: 'fit-content',
                  position: 'sticky',
                  top: 20
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <FilterList sx={{ color: '#f37021' }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    Bộ lọc danh mục
                  </Typography>
                </Box>

                {/* <Button
                  size="small"
                  variant={selectedCategories.length === categories.length ? "contained" : "outlined"}
                  fullWidth
                  sx={{
                    mb: 3,
                    textTransform: 'none',
                    borderRadius: 2,
                    borderColor: '#f37021',
                    color: '#f37021',
                    py: 1
                  }}
                  onClick={() =>
                    setSelectedCategories(selectedCategories.length === categories.length ? [] : categories)
                  }
                >
                  {selectedCategories.length === categories.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </Button> */}

                <Divider sx={{ mb: 2 }} />

                <FormGroup sx={{ gap: 0.5 }}>
                  {categories.map((category) => (
                    <FormControlLabel
                      key={category}
                      sx={{
                        mx: 0,
                        py: 0.5,
                        px: 1,
                        borderRadius: 2,
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                      control={
                        <Checkbox
                          checked={selectedCategories.includes(category)}
                          onChange={() => handleCategoryChange(category)}
                          sx={{ mr: 1 }}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <Typography variant="body2" sx={{ fontSize: '0.95rem', fontWeight: 'medium' }}>
                            {category}
                          </Typography>
                          <Chip
                            label={getCategoryCount(category)}
                            size="small"
                            color={getCategoryColor(category) as any}
                            sx={{
                              minWidth: 24,
                              height: 20,
                              ml: 1,
                              fontSize: '0.75rem',
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                        </Box>
                      }
                    />
                  ))}
                </FormGroup>

                <Divider sx={{ my: 2 }} />

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
                  {filteredSimulations.length} / {simulations.length} mô phỏng
                </Typography>
              </Paper>

              {/* Main Content */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {filteredSimulations.length > 0 ? (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(1, 1fr)',
                        md: 'repeat(2, 1fr)',
                        lg: 'repeat(2, 1fr)',
                        xl: 'repeat(3, 1fr)'
                      },
                      gap: 3,
                    }}
                  >
                    {filteredSimulations.map((sim) => (
                      <Card
                        key={sim.id}
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                          },
                          borderRadius: 3,
                          overflow: 'hidden',
                          cursor: 'pointer'
                        }}
                        elevation={2}
                      >
                        <CardActionArea
                          onClick={() => loadSimulation(sim.id)}
                          sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                        >
                          <Box
                            sx={{
                              height: 100,
                              backgroundColor: sim.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '3rem',
                              background: `linear-gradient(135deg, ${sim.color} 0%, ${sim.color}80 100%)`,
                              position: 'relative',
                              overflow: 'hidden',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(255,255,255,0.1)',
                                opacity: 0,
                                transition: 'opacity 0.3s ease'
                              },
                              '&:hover::before': {
                                opacity: 1
                              }
                            }}
                          >
                            {sim.icon}
                          </Box>
                          <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                            <Typography
                              variant="h6"
                              component="h2"
                              gutterBottom
                              sx={{
                                fontWeight: 'bold',
                                color: 'text.primary',
                                fontSize: '1.1rem',
                                lineHeight: 1.3
                              }}
                            >
                              {sim.title}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                mb: 2,
                                lineHeight: 1.5,
                                fontSize: '0.875rem',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                            >
                              {sim.description}
                            </Typography>
                            <Chip
                              label={sim.category}
                              color={getCategoryColor(sim.category) as any}
                              size="small"
                              sx={{
                                fontWeight: 'medium',
                                fontSize: '0.75rem',
                                '& .MuiChip-label': { px: 1.5 }
                              }}
                            />
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Paper
                    elevation={1}
                    sx={{
                      p: 6,
                      textAlign: 'center',
                      borderRadius: 3,
                      backgroundColor: 'grey.50'
                    }}
                  >
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      Không tìm thấy mô phỏng
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Không có mô phỏng nào phù hợp với bộ lọc đã chọn. Hãy thử chọn danh mục khác.
                    </Typography>
                  </Paper>
                )}
              </Box>
            </Box>
          </Fade>
        )}

        {selectedSimulation && selectedSimData && (
          <Fade in={!!selectedSimulation} timeout={500}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Breadcrumbs */}
              <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }} separator="›">
                <Link
                  color="inherit"
                  underline="hover"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    '&:hover': { color: 'primary.main' }
                  }}
                  onClick={() => navigate('/')}
                >
                  <HomeIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Trang chủ
                </Link>

                <Link
                  color="inherit"
                  underline="hover"
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { color: 'primary.main' }
                  }}
                  onClick={handleBack}
                >
                  Danh sách mô phỏng
                </Link>

                <Typography color="text.primary" sx={{ fontWeight: 'medium' }}>
                  {selectedSimData.title}
                </Typography>
              </Breadcrumbs>

              {/* Simulation Header */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      backgroundColor: selectedSimData.color,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2.5rem',
                      background: `linear-gradient(135deg, ${selectedSimData.color} 0%, ${selectedSimData.color}80 100%)`
                    }}
                  >
                    {selectedSimData.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h4"
                      component="h1"
                      sx={{
                        fontFamily: '"Be Vietnam Pro", sans-serif',
                        fontWeight: 'bold',
                        color: 'text.primary',
                        mb: 0
                      }}
                    >
                      {selectedSimData.title}
                    </Typography>
                    <Chip
                      label={selectedSimData.category}
                      color={getCategoryColor(selectedSimData.category) as any}
                      size="medium"
                      sx={{ fontWeight: 'medium' }}
                    />
                  </Box>
                </Box>

                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{
                    lineHeight: 1.6,
                    fontSize: '1.1rem',
                    mb: 0
                  }}
                >
                  {selectedSimData.description}
                </Typography>
              </Box>

              <Button
                startIcon={<ArrowBack />}
                onClick={handleBack}
                variant="outlined"
                sx={{
                  mb: 2,
                  alignSelf: 'flex-start',
                  borderRadius: 3,
                  px: 3,
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 'medium',
                  color: '#f37021',
                  borderColor: '#f37021',
                }}
                className='btn btn-primary'
              >
                Quay lại danh sách
              </Button>

              {loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, gap: 2 }}>
                  <CircularProgress size={24} />
                  <Typography variant="h6" color="text.secondary">
                    Đang tải mô phỏng...
                  </Typography>
                </Box>
              )}

              <Card
                sx={{
                  flexGrow: 1,
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                }}
                elevation={4}
              >
                <Box
                  component="iframe"
                  title="Unity WebGL Simulation"
                  src={`${UNITY_PHY_URL}?tool=${encodeURIComponent(selectedSimulation)}`}
                  sx={{ width: '100%', height: '800px', border: 'none', display: 'block' }}
                  onLoad={handleIframeLoad}
                  allowFullScreen
                />
              </Card>
            </Box>
          </Fade>
        )}
      </Container>
      <Footer listMenuUser={listMenuUser} />
    </>
  );
};

export default UnitySimulations;