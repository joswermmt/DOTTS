/* DOTTS - SQL Server schema (sin Docker)
   Ejecuta este script sobre la base de datos: dotts
*/

SET NOCOUNT ON;

IF OBJECT_ID(N'[dbo].[Categoria]', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[Categoria] (
    [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [nombre] NVARCHAR(100) NOT NULL,
    [descripcion] NVARCHAR(500) NULL,
    CONSTRAINT [UQ_Categoria_nombre] UNIQUE ([nombre])
  );
END;

IF OBJECT_ID(N'[dbo].[Usuario]', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[Usuario] (
    [id] NVARCHAR(36) NOT NULL PRIMARY KEY,
    [nombre] NVARCHAR(255) NOT NULL,
    [correo] NVARCHAR(255) NOT NULL,
    [telefono] NVARCHAR(50) NULL,
    [contrasena] NVARCHAR(255) NOT NULL,
    [rol] NVARCHAR(20) NOT NULL CONSTRAINT [DF_Usuario_rol] DEFAULT ('CLIENTE'),
    [fotoUrl] NVARCHAR(1000) NULL,
    [lat] FLOAT NULL,
    [lng] FLOAT NULL,
    [experiencia] NVARCHAR(MAX) NULL,
    [bloqueado] BIT NOT NULL CONSTRAINT [DF_Usuario_bloqueado] DEFAULT (0),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [DF_Usuario_createdAt] DEFAULT (SYSUTCDATETIME()),
    [updatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_Usuario_updatedAt] DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [UQ_Usuario_correo] UNIQUE ([correo])
  );
END;

IF OBJECT_ID(N'[dbo].[Servicio]', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[Servicio] (
    [id] NVARCHAR(36) NOT NULL PRIMARY KEY,
    [titulo] NVARCHAR(255) NOT NULL,
    [descripcion] NVARCHAR(MAX) NOT NULL,
    [precio] DECIMAL(12,2) NOT NULL,
    [esFijo] BIT NOT NULL CONSTRAINT [DF_Servicio_esFijo] DEFAULT (1),
    [proveedorId] NVARCHAR(36) NOT NULL,
    [categoriaId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [DF_Servicio_createdAt] DEFAULT (SYSUTCDATETIME()),
    [updatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_Servicio_updatedAt] DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [FK_Servicio_Usuario] FOREIGN KEY ([proveedorId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Servicio_Categoria] FOREIGN KEY ([categoriaId]) REFERENCES [dbo].[Categoria]([id])
  );

  CREATE INDEX [IX_Servicio_categoriaId] ON [dbo].[Servicio]([categoriaId]);
  CREATE INDEX [IX_Servicio_proveedorId] ON [dbo].[Servicio]([proveedorId]);
END;

IF OBJECT_ID(N'[dbo].[SolicitudServicio]', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[SolicitudServicio] (
    [id] NVARCHAR(36) NOT NULL PRIMARY KEY,
    [servicioId] NVARCHAR(36) NOT NULL,
    [clienteId] NVARCHAR(36) NOT NULL,
    [proveedorId] NVARCHAR(36) NOT NULL,
    [estado] NVARCHAR(30) NOT NULL CONSTRAINT [DF_Solicitud_estado] DEFAULT ('PENDIENTE'),
    [programadoPara] DATETIME2 NULL,
    [detalles] NVARCHAR(MAX) NULL,
    [esInmediato] BIT NOT NULL CONSTRAINT [DF_Solicitud_esInmediato] DEFAULT (1),
    [solicitadoEn] DATETIME2 NOT NULL CONSTRAINT [DF_Solicitud_solicitadoEn] DEFAULT (SYSUTCDATETIME()),
    [updatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_Solicitud_updatedAt] DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [FK_Solicitud_Servicio] FOREIGN KEY ([servicioId]) REFERENCES [dbo].[Servicio]([id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Solicitud_Cliente] FOREIGN KEY ([clienteId]) REFERENCES [dbo].[Usuario]([id]),
    CONSTRAINT [FK_Solicitud_Proveedor] FOREIGN KEY ([proveedorId]) REFERENCES [dbo].[Usuario]([id])
  );

  CREATE INDEX [IX_Solicitud_clienteId] ON [dbo].[SolicitudServicio]([clienteId]);
  CREATE INDEX [IX_Solicitud_proveedorId] ON [dbo].[SolicitudServicio]([proveedorId]);
  CREATE INDEX [IX_Solicitud_estado] ON [dbo].[SolicitudServicio]([estado]);
END;

