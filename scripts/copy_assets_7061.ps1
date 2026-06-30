$brainDir = "C:\Users\scope\.gemini\antigravity\brain\0fb7d0d6-6931-4f04-81ec-b0cc8280e2ac"
$targetDir = "D:\dev\code-wirth-dawn\public\images\quests"

Write-Host "Copying generated image assets to public/images/quests..."
Copy-Item "$brainDir\fg_rift_well_1782811550197.png" "$targetDir\fg_rift_well.png" -Force
Copy-Item "$brainDir\fg_rift_spring_1782811424020.png" "$targetDir\fg_rift_spring.png" -Force
Copy-Item "$brainDir\fg_rift_trap_spears_1782811433497.png" "$targetDir\fg_rift_trap_spears.png" -Force
Copy-Item "$brainDir\fg_rift_merchant_1782811783948.png" "$targetDir\fg_rift_merchant.png" -Force
Copy-Item "$brainDir\fg_rift_chest_1782811822045.png" "$targetDir\fg_rift_chest.png" -Force
Copy-Item "$brainDir\fg_rift_door_basic_1782811772527.png" "$targetDir\fg_rift_door_basic.png" -Force
Copy-Item "$brainDir\fg_rift_door_iron_1782811574321.png" "$targetDir\fg_rift_door_iron.png" -Force
Copy-Item "$brainDir\fg_rift_door_boss_1782811588368.png" "$targetDir\fg_rift_door_boss.png" -Force

Write-Host "Copying dummy BGM to public/raw_audio/bgm..."
$bgmSource = "D:\dev\code-wirth-dawn\public\raw_audio\bgm\bgm_quest_mystery.mp3"
$bgmTarget = "D:\dev\code-wirth-dawn\public\raw_audio\bgm\bgm_rift_upper.mp3"
Copy-Item $bgmSource $bgmTarget -Force

Write-Host "Asset copy completed successfully."
