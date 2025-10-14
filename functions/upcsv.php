<?php

// Conectar ao banco de dados usando mysqli

echo 'nadanao';

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_FILES['csv_file'])) {

    echo 'nadanao';
    $file = $_FILES['csv_file']['tmp_name'];

    // Abrir o arquivo CSV
    if (($handle = fopen($file, "r")) !== FALSE) {
        fgetcsv($handle, 1000, ","); // Pular a primeira linha (cabeçalhos)


        while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {

            // Vincular os parâmetros e executar a declaração SQL
            echo json_encode($data);
        }

        fclose($handle);
        $stmt->close();
        echo "Contatos inseridos com sucesso!";
    } else {
        echo "Erro ao abrir o arquivo CSV.";
    }

    // Redirecionar para a página principal
    exit;
}
