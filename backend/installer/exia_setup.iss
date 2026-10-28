; Script generated for Exia Desktop AI Voice Agent Installer
; Inno Setup 6.x / Unicode

#define MyAppName "Exia"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Exia AI"
#define MyAppURL "https://exia.ai"
#define MyAppExeName "Exia.exe"

[Setup]
; App Identity
AppId={{D8C9514F-6B22-4EFA-9DF1-A48011F49C52}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}

; Standard modern per-user installation (matches Chrome/VSCode user installs, no admin elevation prompt)
DefaultDirName={localappdata}\Programs\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog

; Output configuration
OutputDir=..\release
OutputBaseFilename=Exia-Setup-{#MyAppVersion}
SetupIconFile=..\exia-icon.ico
UninstallDisplayIcon={app}\{#MyAppExeName}

; Compression (Ultra LZMA2 for lowest possible installer size)
Compression=lzma2/ultra64
InternalCompressLevel=ultra64
SolidCompression=yes

; Visual wizard appearance
WizardStyle=modern
DisableWelcomePage=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: checkedonce

[Files]
Source: "..\release\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\exia-icon.ico"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
