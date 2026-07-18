-- Admin user ko database mein add karo
INSERT INTO leads (name, email, password, shop_name, role, subscription_status)
VALUES (
  'Admin User',
  'devbusines01@gmail.com',
  'TaYOpc9THewup94D6429qC3vxe+fZFKp',
  'QuickCart Admin',
  'admin',
  'active'
)
ON CONFLICT (email) DO NOTHING;
