<?php
include '../conn.php'; // Inclui a conexão com o banco de dados
session_start();

// Conectar ao banco de dados usando mysqli
$conn = new mysqli($host, $username, $password, $dbname);

// Verificar a conexão
if ($conn->connect_error) {
    die("Conexão falhou: " . $conn->connect_error);
}
echo 'nadanao';

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_FILES['csv_file'])) {

    echo 'nadanao';
    $file = $_FILES['csv_file']['tmp_name'];

    // Abrir o arquivo CSV
    if (($handle = fopen($file, "r")) !== FALSE) {
        fgetcsv($handle, 1000, ","); // Pular a primeira linha (cabeçalhos)


        while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
            $email = $data[0];
            $tel = $data[2];
            $name = $data[1];
            $id_user = $_SESSION['id'];

            // Vincular os parâmetros e executar a declaração SQL
            echo $email;
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

$conn->close();
