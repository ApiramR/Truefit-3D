import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clothApi } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useToast } from '../components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

interface User {
  id: number;
  username: string;
  email: string;
  gender: string;
  role: string;
}

interface Brand {
  id: number;
  name: string;
  description?: string;
}

interface Company {
  id: number;
  name: string;
  description?: string;
  website?: string;
}

export function AdminPortal() {
  const [users, setUsers] = useState<User[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  
  // Form states
  const [userFormData, setUserFormData] = useState({
    username: '',
    email: '',
    password: '',
    gender: '',
  });
  
  const [brandFormData, setBrandFormData] = useState({
    name: '',
    description: '',
  });
  
  const [companyFormData, setCompanyFormData] = useState({
    name: '',
    description: '',
    website: '',
  });

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        console.log('Checking admin status...');
        const profile = await clothApi.getProfile();
        console.log('Profile response:', profile);
        
        if (profile.role !== 'ADMIN') {
          console.log('User is not an admin, redirecting...');
          navigate('/');
          toast({
            title: 'Access Denied',
            description: 'Only admins can access this page',
            variant: 'destructive',
          });
        } else {
          console.log('User is admin, fetching data...');
          fetchAllData();
        }
      } catch (error) {
        console.error('Admin check error:', error);
        navigate('/');
        toast({
          title: 'Error',
          description: 'Failed to verify admin status',
          variant: 'destructive',
        });
      }
    };
    checkAdmin();
  }, [navigate, toast]);

  const fetchAllData = async () => {
    try {
      console.log('Fetching all data...');
      const [usersData, brandsData, companiesData] = await Promise.all([
        clothApi.getAllUsers(),
        clothApi.getAllBrands(),
        clothApi.getAllCompanies()
      ]);
      console.log('Users data:', usersData);
      console.log('Brands data:', brandsData);
      console.log('Companies data:', companiesData);
      setUsers(usersData);
      setBrands(brandsData);
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // User management handlers
  const handleUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await clothApi.createAdmin(userFormData);
      toast({
        title: 'Success',
        description: 'New admin created successfully',
      });
      setUserFormData({
        username: '',
        email: '',
        password: '',
        gender: '',
      });
      fetchAllData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create admin',
        variant: 'destructive',
      });
    }
  };

  // Brand management handlers
  const handleBrandSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await clothApi.createBrand(brandFormData);
      toast({
        title: 'Success',
        description: 'New brand created successfully',
      });
      setBrandFormData({
        name: '',
        description: '',
      });
      fetchAllData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create brand',
        variant: 'destructive',
      });
    }
  };

  // Company management handlers
  const handleCompanySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await clothApi.createCompany(companyFormData);
      toast({
        title: 'Success',
        description: 'New company created successfully',
      });
      setCompanyFormData({
        name: '',
        description: '',
        website: '',
      });
      fetchAllData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create company',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Portal</h1>
      
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Create New Admin</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUserSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      value={userFormData.username}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, username: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={userFormData.email}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={userFormData.password}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={userFormData.gender}
                      onValueChange={(value) => setUserFormData(prev => ({ ...prev, gender: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">Create Admin</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="capitalize">{user.gender}</TableCell>
                        <TableCell className="capitalize">{user.role}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Brands Tab */}
        <TabsContent value="brands">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Add New Brand</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBrandSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="brandName">Brand Name</Label>
                    <Input
                      id="brandName"
                      name="name"
                      value={brandFormData.name}
                      onChange={(e) => setBrandFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brandDescription">Description</Label>
                    <Input
                      id="brandDescription"
                      name="description"
                      value={brandFormData.description}
                      onChange={(e) => setBrandFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <Button type="submit" className="w-full">Add Brand</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Brands</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brands.map((brand) => (
                      <TableRow key={brand.id}>
                        <TableCell>{brand.name}</TableCell>
                        <TableCell>{brand.description}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" className="mr-2">Edit</Button>
                          <Button variant="destructive" size="sm">Delete</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Companies Tab */}
        <TabsContent value="companies">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Add New Company</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCompanySubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      name="name"
                      value={companyFormData.name}
                      onChange={(e) => setCompanyFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyDescription">Description</Label>
                    <Input
                      id="companyDescription"
                      name="description"
                      value={companyFormData.description}
                      onChange={(e) => setCompanyFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyWebsite">Website</Label>
                    <Input
                      id="companyWebsite"
                      name="website"
                      type="url"
                      value={companyFormData.website}
                      onChange={(e) => setCompanyFormData(prev => ({ ...prev, website: e.target.value }))}
                    />
                  </div>
                  <Button type="submit" className="w-full">Add Company</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Companies</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell>{company.name}</TableCell>
                        <TableCell>{company.description}</TableCell>
                        <TableCell>
                          <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {company.website}
                          </a>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" className="mr-2">Edit</Button>
                          <Button variant="destructive" size="sm">Delete</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 