-- Criar tabela de configurações do site
CREATE TABLE public.configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telefone TEXT NOT NULL,
  email TEXT NOT NULL,
  horario TEXT NOT NULL,
  historia TEXT NOT NULL,
  mapa_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir dados iniciais
INSERT INTO public.configuracoes (telefone, email, horario, historia, mapa_url)
VALUES (
  '+351 21 123 4567',
  'contato@restaurante.pt',
  'Segunda a Sábado: 12:00 - 23:00 | Domingo: 12:00 - 22:00',
  'Desde 1985, o nosso restaurante tem servido a melhor gastronomia portuguesa com um toque contemporâneo. Combinamos tradição, qualidade e paixão em cada prato.',
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3112.7269739394823!2d-9.142685!3d38.708163!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzjCsDQyJzI5LjQiTiA5wrAwOCczMy43Ilc!5e0!3m2!1spt-PT!2spt!4v1234567890'
);

-- Criar tabela de ementa
CREATE TABLE public.ementa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco DECIMAL(10, 2) NOT NULL,
  secao TEXT NOT NULL CHECK (secao IN ('Entradas', 'Pratos Principais', 'Sobremesas', 'Bebidas')),
  destaque BOOLEAN DEFAULT false,
  imagem_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir pratos de exemplo
INSERT INTO public.ementa (nome, descricao, preco, secao, destaque, imagem_url) VALUES
('Bacalhau à Brás', 'Bacalhau desfiado com batata palha, cebola e ovos', 16.50, 'Pratos Principais', true, 'https://placehold.co/400x300/C84B31/FFF?text=Bacalhau'),
('Polvo à Lagareiro', 'Polvo assado com batatas a murro e azeite', 22.00, 'Pratos Principais', true, 'https://placehold.co/400x300/C84B31/FFF?text=Polvo'),
('Bife à Portuguesa', 'Bife grelhado com molho especial e batata frita', 18.50, 'Pratos Principais', true, 'https://placehold.co/400x300/C84B31/FFF?text=Bife'),
('Caldo Verde', 'Sopa tradicional portuguesa', 4.50, 'Entradas', false, null),
('Pastéis de Bacalhau', '4 unidades de pastéis crocantes', 6.00, 'Entradas', false, null),
('Pastel de Nata', 'Pastel de nata tradicional', 1.20, 'Sobremesas', false, null),
('Mousse de Chocolate', 'Mousse cremosa de chocolate negro', 3.50, 'Sobremesas', false, null);

-- Criar tabela de reservas
CREATE TABLE public.reservas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  apelido TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL,
  data_reserva DATE NOT NULL,
  hora_reserva TIME NOT NULL,
  numero_pessoas INTEGER NOT NULL CHECK (numero_pessoas > 0 AND numero_pessoas <= 20),
  estado TEXT NOT NULL DEFAULT 'pendente' CHECK (estado IN ('pendente', 'confirmado', 'rejeitado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Criar tabela de roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Função para verificar se usuário tem role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- RLS Policies para configuracoes
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Configurações são visíveis para todos"
ON public.configuracoes FOR SELECT
TO public
USING (true);

CREATE POLICY "Apenas admins podem atualizar configurações"
ON public.configuracoes FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para ementa
ALTER TABLE public.ementa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ementa é visível para todos"
ON public.ementa FOR SELECT
TO public
USING (true);

CREATE POLICY "Apenas admins podem inserir itens na ementa"
ON public.ementa FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins podem atualizar ementa"
ON public.ementa FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins podem deletar da ementa"
ON public.ementa FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para reservas
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer pessoa pode criar reserva"
ON public.reservas FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Apenas admins podem ver todas as reservas"
ON public.reservas FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins podem atualizar reservas"
ON public.reservas FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Apenas admins podem gerenciar roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_configuracoes_updated_at
BEFORE UPDATE ON public.configuracoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ementa_updated_at
BEFORE UPDATE ON public.ementa
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reservas_updated_at
BEFORE UPDATE ON public.reservas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();